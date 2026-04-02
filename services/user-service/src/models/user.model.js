function toPassengerProfile(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    accountRef: row.account_ref,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    gender: row.gender,
    dateOfBirth: row.date_of_birth,
    status: row.status,
    isActive: row.is_active,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = {
  toPassengerProfile
};
