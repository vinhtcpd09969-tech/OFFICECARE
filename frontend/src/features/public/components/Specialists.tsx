import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import ScrollReveal from './ScrollReveal';

export default function Specialists() {
  const specialists = [
    {
      name: "BS. Lê Minh",
      role: "Chuyên gia Cột sống",
      rating: "4.9 (120+ Đánh giá)",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC56kKgoRIQD5vQbEfUl1xJG2ny1DGdoeBR4ZyMYXYOwOfLZn31f8nW3QztXsu67p_I5H9F7UMKyNu2a-5PCBZLZWewpawx4wCLhFrVQ_fbDQw29KJ2tGkOzkRTXLAAMU1_0aEjUswHQEwLQE30VxFVxsGsu0FvflLFJnx-WQT56xu3154tt2k9O3VuRrq6HO5_LlARHcKSKpKWBLxLu8fACaWX1y4MHIXnfs5pI3uXRvFfHM2k18e0LpfjiQImNwKBYZRJPWDn9oY",
      tags: ["#Cổ_Vai_Gáy", "#Trị_liệu_tay"]
    },
    {
      name: "ThS. Nguyễn An",
      role: "Vật lý trị liệu Thể thao",
      rating: "5.0 (85+ Đánh giá)",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVebMGOYVeWP2zMOyDorC4_IwOQChG-4gAOZfUl52CvAc2UKGVnPdUm5YTMpSGSQsqtHgANKs7EMU3j6G1MpZ5qYqcPO5htpZjDYjtH1QQN47QlvQL1GVcyiuXt48bHgzlRmBVB5Hey7LNIGaWNilH8wMIYX-KtHsxriTWTFuwSncfR-6nUijVJgoKzOWSeVZDUkTnoBNwFyYff5mJ00WLhCR4tj_dhS3-rOb1Y_paBzMTFZPrTk-zg29iVcQMp4vpN8eGbEh72MU",
      tags: ["#Chấn_thương", "#Hậu_phẫu"]
    },
    {
      name: "KTV. Hoàng Yến",
      role: "Phục hồi tư thế (Ergonomic)",
      rating: "4.8 (95+ Đánh giá)",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCz0YQW5S-JtQzK31sGAhkXFnS1s5SfB1LFWiMU_DRc5RBfFpYBx1qXDOO9dlJFLENkVxOhwntUXjzdPjsDa5Q3wmHHTW0CAtettet1wE3tXPWNh2B2Q77DTlcH_81SaltZkqfIgWT7wVQJYblmSwmdDecPNqUzwQam3FOAoEkoGpEGXABqSuYZklW7d19dFUKxefLI4FOe5FsfduKUUyOVQkX57yUJ66pNJjR-8MruScPHGkGl0D2rg6f4faI7RdUTNW5mbZ_hRCI",
      tags: ["#Dân_văn_phòng", "#Tư_thế"]
    }
  ];

  return (
    <section className="py-xxl bg-slate-50/50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-primary font-black tracking-widest uppercase text-xs mb-3 font-jakarta">Đội ngũ của chúng tôi</h2>
            <h3 className="font-jakarta text-3xl md:text-4xl font-extrabold text-secondary mb-4 leading-tight">Chuyên Gia Hàng Đầu</h3>
            <div className="h-1.5 w-24 bg-primary mx-auto rounded-full"></div>
            <p className="text-slate-500 font-medium text-sm md:text-base mt-4">
              Đội ngũ y bác sĩ và kỹ thuật viên vật lý trị liệu có bằng cấp chuyên môn cao, hơn 10 năm kinh nghiệm đồng hành cùng bạn.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {specialists.map((specialist, idx) => (
            <ScrollReveal key={idx} delay={idx * 100}>
              <motion.div 
                whileHover={{ y: -6, boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.05)" }}
                className="bg-white rounded-[40px] p-6 shadow-sm border border-slate-100 transition-all duration-300 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="relative mb-6 rounded-[32px] overflow-hidden aspect-[4/3] bg-slate-200">
                    <img 
                      className="w-full h-full object-cover" 
                      src={specialist.image} 
                      alt={specialist.name}
                    />
                    <div className="absolute bottom-4 left-4 bg-primary text-white px-3 py-1.5 rounded-full font-jakarta text-[10px] font-black flex items-center gap-1 shadow-sm">
                      <Star size={11} fill="white" /> {specialist.rating}
                    </div>
                  </div>
                  <h4 className="font-jakarta font-black text-xl text-secondary mb-1">{specialist.name}</h4>
                  <p className="font-jakarta text-xs text-primary font-bold mb-4">{specialist.role}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {specialist.tags.map((t, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-50 text-slate-500 font-jakarta text-[10px] font-extrabold rounded-full border border-slate-100">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <Link 
                  to="/booking" 
                  className="w-full block text-center py-3.5 font-jakarta font-extrabold border border-primary text-primary hover:bg-primary hover:text-white rounded-2xl transition-all text-xs"
                >
                  Đặt Lịch Tư Vấn Với Bác Sĩ
                </Link>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
