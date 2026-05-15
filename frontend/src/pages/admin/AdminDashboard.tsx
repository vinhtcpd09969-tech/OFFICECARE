export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Placeholder Stat Cards */}
        {[
          { title: 'Doanh thu hôm nay', value: '12.500.000đ', color: 'text-teal-600' },
          { title: 'Khách hàng mới', value: '+12', color: 'text-blue-600' },
          { title: 'Lịch khám', value: '45', color: 'text-indigo-600' },
          { title: 'Gói đang hoạt động', value: '128', color: 'text-emerald-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-medium text-slate-500 mb-2">{stat.title}</h3>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[400px] flex items-center justify-center">
        <p className="text-slate-500">Biểu đồ thống kê sẽ được cập nhật ở Phase sau.</p>
      </div>
    </div>
  );
}
