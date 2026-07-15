import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getMedicalRecords } from '../../api/admin.api';
import PatientEmrDetail from '../../components/PatientEmrDetail';

export default function ManageMedicalRecords() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [viewState, setViewState] = useState<'overview' | 'detail'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const recordsRes = await getMedicalRecords();
      setPatients(recordsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể kết nối API hồ sơ điều trị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPatients = patients.filter(p => {
    const patientCode = 'KH-' + p.id.substring(0, 8).toUpperCase();
    const matchesSearch = p.ho_ten?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.so_dien_thoai?.includes(searchTerm) ||
      patientCode.toLowerCase().includes(searchTerm.toLowerCase());

    const hasPlansOrCompletedApts = (p.plans?.length || 0) > 0 || p.appointments?.some((ap: any) => ap.trang_thai === 'hoan_thanh');
    return matchesSearch && hasPlansOrCompletedApts;
  });

  if (viewState === 'detail' && selectedPatient) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <PatientEmrDetail 
          patient={selectedPatient} 
          onBack={() => {
            setSelectedPatient(null);
            setViewState('overview');
          }} 
          showAdminInfo={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
          Danh sách hồ sơ điều trị (tổng quan)
        </h2>
        <p className="text-slate-505 text-xs font-semibold mt-1">
          Theo dõi, tìm kiếm và phân tích tiến độ hồ sơ phác đồ điều trị của toàn bộ khách hàng.
        </p>
      </div>

      {/* Search Filter */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm họ tên, số điện thoại..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-500/10 w-full"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4 font-black">Khách hàng</th>
                <th className="p-4 font-black">Số điện thoại</th>
                <th className="p-4 font-black">Email</th>
                <th className="p-4 font-black text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 font-semibold animate-pulse">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 font-semibold">Không tìm thấy hồ sơ nào.</td>
                </tr>
              ) : (
                filteredPatients.map((p) => {
                  const patientCode = 'KH-' + p.id.substring(0, 8).toUpperCase();
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-4 font-bold text-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] uppercase">
                            {p.ho_ten?.charAt(0) || 'K'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-850 font-bold">{p.ho_ten}</span>
                            <span className="text-[9px] text-slate-400 font-extrabold font-mono mt-0.5">{patientCode}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">{p.so_dien_thoai || '-'}</td>
                      <td className="p-4 font-semibold text-slate-700">{p.email || '-'}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedPatient(p);
                            setViewState('detail');
                          }}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[10px] shadow-sm transition-all"
                        >
                          Xem Hồ Sơ
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
