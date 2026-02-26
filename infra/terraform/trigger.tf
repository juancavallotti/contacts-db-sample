resource "google_cloudbuild_trigger" "main_push" {
  project         = var.project_id
  name            = "contacts-main-deploy"
  service_account = google_service_account.cloudbuild_runner.id

  description = "Build and deploy contacts app to GKE on main branch pushes."
  filename    = "cloudbuild.yaml"

  github {
    owner = var.github_owner
    name  = var.github_repo
    push {
      branch = var.trigger_branch_regex
    }
  }

  substitutions = {
    _ARTIFACT_REPO_PATH = var.artifact_repo_path
    _IMAGE_NAME         = var.image_name
    _CLUSTER_NAME       = google_container_cluster.autopilot.name
    _CLUSTER_REGION     = google_container_cluster.autopilot.location
  }

  depends_on = [
    google_container_cluster.autopilot,
    google_project_iam_member.cloudbuild_runner_custom_role,
    google_service_account_iam_member.allow_legacy_cloudbuild_to_impersonate_runner,
    google_service_account_iam_member.allow_cloudbuild_service_agent_to_impersonate_runner,
  ]
}
