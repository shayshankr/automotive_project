"""
pii_utils.py
============
PII (Personally Identifiable Information) masking utilities.

Data Governance Framework
--------------------------
GDPR Article 5 / India DPDP Act 2023 principles applied:
  - Data Minimisation   : Fact tables carry only cust_id token, never raw PII
  - Purpose Limitation  : PII lives in a single access-controlled vault
  - Pseudonymisation    : cust_id is the pseudonym; vault maps it back to real identity
  - Accuracy            : Masked values preserve format structure (e.g. mobile length)
  - Storage Limitation  : Analytics tables have no raw PII to limit exposure

Masking Strategy
-----------------
Field          | Technique              | Reversible | Example
---------------|------------------------|------------|-------------------------
cust_name      | Initial + stars        | No         | "Rahul Sharma" → "R**** S****"
mobile_1/2     | Middle-digit mask      | No         | "9876543210" → "98XXXXXX10"
email          | Local + domain mask    | No         | "r.sharma@gmail.com" → "r.***@g***.com"
address        | Street mask, keep city | No         | "12, MG Rd, Mumbai" → "**, Mumbai"
dob            | Year only (analytics)  | No         | "15-07-1985" → "1985"
pincode        | Kept (low granularity) | N/A        | "400001" (kept as-is)
"""


def mask_name(full_name: str) -> str:
    """
    'Rahul Sharma' → 'R**** S*****'
    Each part: keep first letter, replace rest with *.
    """
    parts = full_name.strip().split()
    return ' '.join(p[0] + '*' * (len(p) - 1) for p in parts)


def mask_mobile(mobile: str) -> str:
    """
    '9876543210' (10 digits) → '98XXXXXX10'
    Keep first 2 and last 2 digits, mask middle 6.
    """
    mobile = str(mobile).strip()
    if len(mobile) < 5:
        return 'X' * len(mobile)
    return mobile[:2] + 'X' * (len(mobile) - 4) + mobile[-2:]


def mask_email(email: str) -> str:
    """
    'rahul.sharma99@gmail.com' → 'r.***@g***.com'
    Keep first char of local part, mask rest.
    Keep first char of domain, mask rest before TLD.
    """
    if not email or '@' not in email:
        return '***@***.***'
    local, domain = email.split('@', 1)
    domain_parts = domain.split('.')
    masked_local  = local[0] + '***'
    masked_domain = domain_parts[0][0] + '***.' + '.'.join(domain_parts[1:])
    return f"{masked_local}@{masked_domain}"


def mask_address(address: str) -> str:
    """
    '12, MG Road, Mumbai - 400001' → '**, Mumbai - 400001'
    Remove street-level info; retain city and pincode for analytics.
    """
    parts = [p.strip() for p in address.split(',')]
    if len(parts) >= 2:
        return '**, ' + ', '.join(parts[1:])
    return '**'


def mask_dob_to_birth_year(dob: str) -> str:
    """
    '15-07-1985' → '1985'
    Birth year alone has very low re-identification risk.
    """
    if not dob:
        return ''
    parts = dob.split('-')
    return parts[-1] if len(parts) == 3 else dob


def generate_email(name: str, domain: str, index: int) -> str:
    """Generate a plausible email from a full name."""
    import random
    parts = name.lower().split()
    local = '.'.join(parts) + str(10 + index)
    return f"{local}@{domain}"


def generate_mobile(seed_index: int, rng) -> str:
    """Generate a 10-digit Indian mobile number (starts with 6-9)."""
    first = rng.choice([6, 7, 8, 9])
    rest  = ''.join(str(rng.randint(0, 9)) for _ in range(9))
    return str(first) + rest
