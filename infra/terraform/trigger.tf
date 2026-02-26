resource "google_cloudbuild_trigger" "main_push" {
  project = var.project_id
  name    = "contacts-main-deploy"

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
    google_project_iam_member.cloudbuild_artifactregistry_writer,
    google_project_iam_member.cloudbuild_container_developer,
    google_project_iam_member.cloudbuild_service_account_user,
  ]
}
