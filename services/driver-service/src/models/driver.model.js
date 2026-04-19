function toDriverProfile(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    licenseNumber: row.license_number,
    vehicleType: row.vehicle_type,
    vehiclePlate: row.vehicle_plate,
    availabilityStatus: row.availability_status,
    location:
      row.current_latitude !== null && row.current_longitude !== null
        ? {
            latitude: Number(row.current_latitude),
            longitude: Number(row.current_longitude)
          }
        : null,
    ratingAvg: Number(row.rating_avg),
    isActive: row.is_active,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = {
  toDriverProfile
};
