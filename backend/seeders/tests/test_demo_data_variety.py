from seeders.demo_data_variety import (
    get_tenant_profile,
    patient_document,
    patient_identity,
)


def test_each_tenant_has_distinct_identity_at_same_index():
    norte = get_tenant_profile('clinica_norte')
    sur = get_tenant_profile('clinica_sur')
    assert patient_identity(5, norte) != patient_identity(5, sur)


def test_document_prefix_is_per_tenant():
    norte = get_tenant_profile('clinica_norte')
    sur = get_tenant_profile('clinica_sur')
    assert patient_document(norte, 2026, 3, 1).startswith('CNRT-')
    assert patient_document(sur, 2026, 3, 1).startswith('CSUR-')


def test_many_patients_have_unique_names_within_tenant():
    profile = get_tenant_profile('clinica_demo')
    names = {patient_identity(i, profile) for i in range(1, 49)}
    assert len(names) >= 40
