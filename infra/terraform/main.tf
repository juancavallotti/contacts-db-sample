locals {
  required_services = toset([
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "compute.googleapis.com",
    "container.googleapis.com",
    "dns.googleapis.com",
    "iam.googleapis.com",
  ])
}

resource "google_project_service" "required" {
  for_each           = local.required_services
  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_container_cluster" "autopilot" {
  provider            = google-beta
  name                = var.cluster_name
  location            = var.region
  enable_autopilot    = true
  deletion_protection = false
  release_channel {
    channel = "REGULAR"
  }

  depends_on = [
    google_project_service.required,
  ]
}
