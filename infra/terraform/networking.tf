resource "google_compute_global_address" "contacts_ingress" {
  name = var.ingress_static_ip_name

  depends_on = [
    google_project_service.required,
  ]
}

resource "google_dns_record_set" "contacts_a_record" {
  managed_zone = var.dns_managed_zone
  name         = var.contacts_dns_name
  type         = "A"
  ttl          = 300
  rrdatas = [
    google_compute_global_address.contacts_ingress.address,
  ]

  depends_on = [
    google_project_service.required,
  ]
}
