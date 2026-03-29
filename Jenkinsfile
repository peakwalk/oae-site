@Library('dg-build-shared-library') _

pipeline {
  agent none

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  parameters {
    choice(
      name: 'STAGE',
      choices: "beta\npre-release\nrelease",
      description: 'Release status used in version metadata, for example beta, pre-release, or release.'
    )
  }

  stages {
    stage('Select Node') {
      agent { label 'master' }
      steps {
        script {
          determineNode()
        }
      }
    }

    stage('Init Env Vars') {
      agent { label "${env.NODE_SELECTED}" }
      steps {
        script {
          env.PROJECT_NAME = 'oae-site'
          env.VERSION = bashCli("echo -n \$(awk -F '\"' '/\"version\"/ {print \$4; exit}' package.json)")
          env.STAGE = params.STAGE?.trim() ? params.STAGE.trim() : (env.STAGE ?: 'beta')
          env.SCM_REVISION = bashCli('echo -n $(git rev-parse --short HEAD)')
          env.TIMESTAMP = bashCli('echo -n $(date +%Y%m%d%H%M%S)')
          env.NODE_VERSION = bashCli("tr -d 'v\\n' < .nvmrc")
          env.FULL_VERSION = "${env.VERSION}-${env.STAGE}-${env.BUILD_NUMBER}-${env.SCM_REVISION}-${env.TIMESTAMP}"
          env.BUILD_NODE_WORKSPACE = "${env.WORKSPACE}"
          env.REPOSITORY = 'docker.peakwalk.tech/oae'
          env.NODE_NODE_IMAGE = "docker.peakwalk.tech/dg4u/node:${env.NODE_VERSION}-slim"
          env.DOCKER_BUILD_NODE = env.NODE_SELECTED == env.NODE_MAC1
            ? env.NODE_MASTER
            : env.NODE_SELECTED
          env.HAS_TYPESCRIPT_PROJECT = (
            fileExists('tsconfig.json')
            || fileExists('tsconfig.app.json')
            || fileExists('tsconfig.base.json')
            || fileExists('tsconfig.build.json')
          ).toString()
          env.SITE_SHORT_VERSION_TAG = "${env.REPOSITORY}/site:${env.VERSION}"

          currentBuild.displayName = "#${env.BUILD_NUMBER} ${env.VERSION}-${env.STAGE}"

          echo "NODE_SELECTED: ${env.NODE_SELECTED}"
          echo "DOCKER_BUILD_NODE: ${env.DOCKER_BUILD_NODE}"
          echo "JK_HOST_INTERNAL_IP: ${env.JK_HOST_INTERNAL_IP}"
          echo "BUILD_NODE_CREDENTIALS_ID: ${env.BUILD_NODE_CREDENTIALS_ID}"
          echo "PROJECT_NAME: ${env.PROJECT_NAME}"
          echo "VERSION: ${env.VERSION}"
          echo "STAGE: ${env.STAGE}"
          echo "SCM_REVISION: ${env.SCM_REVISION}"
          echo "TIMESTAMP: ${env.TIMESTAMP}"
          echo "NODE_VERSION: ${env.NODE_VERSION}"
          echo "FULL_VERSION: ${env.FULL_VERSION}"
          echo "BUILD_NODE_WORKSPACE: ${env.BUILD_NODE_WORKSPACE}"
          echo "REPOSITORY: ${env.REPOSITORY}"
          echo "HAS_TYPESCRIPT_PROJECT: ${env.HAS_TYPESCRIPT_PROJECT}"
          echo "SITE_SHORT_VERSION_TAG: ${env.SITE_SHORT_VERSION_TAG}"
          echo "NODE_NODE_IMAGE: ${env.NODE_NODE_IMAGE}"
          echo "USE_DOCKER_ON_DARWIN: true"
        }
      }
    }

    stage('Install Dependencies') {
      agent { label "${env.NODE_SELECTED}" }
      steps {
        _nodeCli { NODE_CLI ->
          sh NODE_CLI.replaceAll('%s', './scripts/ci/run-yarn-command.mjs install --frozen-lockfile')
        }
      }
    }

    stage('Typecheck') {
      when {
        beforeAgent true
        expression { return env.HAS_TYPESCRIPT_PROJECT == 'true' }
      }
      agent { label "${env.NODE_SELECTED}" }
      steps {
        _nodeCli { NODE_CLI ->
          sh NODE_CLI.replaceAll('%s', './scripts/ci/run-yarn-command.mjs typecheck')
        }
      }
    }

    stage('Build Release Bundle') {
      agent { label "${env.NODE_SELECTED}" }
      steps {
        _nodeCli { NODE_CLI ->
          sh NODE_CLI.replaceAll('%s', './scripts/ci/run-yarn-command.mjs build:release')
        }
      }
    }

    stage('Copy Release Bundle') {
      when {
        beforeAgent true
        expression { return env.DOCKER_BUILD_NODE != env.NODE_SELECTED }
      }
      agent { label "${env.DOCKER_BUILD_NODE}" }
      steps {
        script {
          syncDist(
            "${env.BUILD_NODE_HOST}",
            "${env.BUILD_NODE_PORT}".toInteger(),
            "${env.BUILD_NODE_CREDENTIALS_ID}",
            "${env.BUILD_NODE_WORKSPACE}/public/*",
            "${env.WORKSPACE}/public"
          )
        }
      }
    }

    stage('Build Site Image') {
      agent { label "${env.DOCKER_BUILD_NODE}" }
      steps {
        _nodeCli { NODE_CLI ->
          sh NODE_CLI.replaceAll('%s', './scripts/docker/build-image.mjs site')
        }
      }
    }

    stage('Push Site Image') {
      agent { label "${env.DOCKER_BUILD_NODE}" }
      steps {
        _nodeCli { NODE_CLI ->
          sh NODE_CLI.replaceAll('%s', './scripts/docker/push-image.mjs site')
        }
      }
    }

    stage('Clean Docker Images') {
      agent { label "${env.DOCKER_BUILD_NODE}" }
      steps {
        script {
          cleanupDockerImages()
        }
      }
    }
  }

  post {
    always {
      node("${env.DOCKER_BUILD_NODE ?: (env.NODE_SELECTED ?: 'master')}") {
        script {
          currentBuild.description = env.FULL_VERSION ?: ''
        }

        addComment_jira()
      }
    }
  }
}

def _nodeCli(Closure closure) {
  withSecretEnv([
    [var: 'NPM_TOKEN', value: "${env.NPM_TOKEN ?: ''}"]
  ]) {
    nodeCli(
      '-e VERSION=${VERSION} ' +
      '-e STAGE=${STAGE} ' +
      '-e BUILD_NUMBER=${BUILD_NUMBER} ' +
      '-e SCM_REVISION=${SCM_REVISION} ' +
      '-e TIMESTAMP=${TIMESTAMP} ' +
      '-e FULL_VERSION=${FULL_VERSION} ' +
      '-e REPOSITORY=${REPOSITORY} ' +
      '-e NPM_TOKEN=${NPM_TOKEN} ',
      '4g',
      '2',
      "${env.NODE_NODE_IMAGE}",
      true
    ) { NODE_CLI ->
      closure(NODE_CLI)
    }
  }
}

def cleanupDockerImages() {
  sh """
#!/bin/bash
set +e
for tag in \\
  "${env.REPOSITORY}/site:${env.VERSION}" \\
  "${env.REPOSITORY}/site:${env.VERSION}-${env.BUILD_NUMBER}" \\
  "${env.REPOSITORY}/site:${env.VERSION}-${env.BUILD_NUMBER}-${env.SCM_REVISION}-${env.TIMESTAMP}"
do
  docker image rm -f "\${tag}" >/dev/null 2>&1 || true
done
"""
}

def withSecretEnv(List<Map> varAndValueList, Closure closure) {
  wrap([$class: 'MaskPasswordsBuildWrapper', varPasswordPairs: varAndValueList]) {
    withEnv(varAndValueList.collect { "${it.var}=${it.value}" }) {
      closure()
    }
  }
}
