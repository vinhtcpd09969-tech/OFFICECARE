// Suy luận chức danh hiển thị của nhân sự khám/điều trị từ tên (có tiền tố "BS."/"KTV.") kèm
// vai_tro_id làm phương án dự phòng khi tên không có tiền tố rõ ràng.
export const getStaffRoleTitle = (staffName: string | null | undefined, roleId: number | null | undefined): string => {
  const nameLower = (staffName || '').toLowerCase();
  if (nameLower.includes('ktv') || nameLower.includes('kỹ thuật viên') || nameLower.includes('kĩ thuật viên')) {
    return 'Kỹ thuật viên PHCN';
  }
  if (nameLower.includes('bs') || nameLower.includes('bác sĩ') || nameLower.includes('bác sỹ')) {
    return 'Bác sĩ chuyên khoa';
  }
  return roleId === 3 ? 'Bác sĩ chuyên khoa' : 'Kỹ thuật viên PHCN';
};
