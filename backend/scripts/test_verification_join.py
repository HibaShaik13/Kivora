import sqlite3

conn = sqlite3.connect("kivora.db")
c = conn.cursor()

print("--- Checking VerificationRecord ---")
c.execute("SELECT id, evidence_id, status FROM verification_records;")
vers = c.fetchall()
print(f"Total verification_records: {len(vers)}")
for v in vers:
    print(v)

print("\n--- Checking EvidenceRecord ---")
c.execute("SELECT id, project_id, title FROM evidence_records;")
evs = c.fetchall()
print(f"Total evidence_records: {len(evs)}")
for e in evs:
    print(e)

print("\n--- Checking PortfolioProject for Evidence project_ids ---")
c.execute("SELECT id, creator_id, title FROM portfolio_projects;")
pps = {p[0]: p for p in c.fetchall()}
print(f"Total portfolio_projects: {len(pps)}")

print("\n--- Testing the JOIN in list_verification_requests_admin ---")
query = """
SELECT v.id, v.status, e.id, e.title, p.id, p.title
FROM verification_records v
JOIN evidence_records e ON v.evidence_id = e.id
JOIN portfolio_projects p ON e.project_id = p.id;
"""
c.execute(query)
joined = c.fetchall()
print(f"Joined records count: {len(joined)}")
for j in joined:
    print(j)

conn.close()
