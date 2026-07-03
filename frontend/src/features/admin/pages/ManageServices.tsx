import { useState } from 'react';
import { useServicesState } from '../components/services/hooks/useServicesState';
import { ServicesHeader } from '../components/services/ui/ServicesHeader';
import { ServicesTable } from '../components/services/ui/ServicesTable';
import { ServiceFormModal } from '../components/services/ui/ServiceFormModal';
import { Service } from '../components/services/types';
import { AnimatePresence, motion } from 'framer-motion';

export default function ManageServices() {
  const {
    services,
    categories,
    loading,
    expandedServiceIds,
    toggleExpandService,
    searchQuery,
    handleSearchChange,
    serviceUsageNamesMap,
    packageCountMap,
    filteredServices,
    handleDelete,
    handleToggleStatus,
    fetchData
  } = useServicesState();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const handleOpenAddModal = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (svc: Service) => {
    setEditingService(svc);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setEditingService(null);
    fetchData();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  return (
    <div className="space-y-6 pb-8 text-zinc-800 font-sans text-sm min-h-[600px]">
      <AnimatePresence mode="wait">
        {!isModalOpen ? (
          <motion.div
            key="services-list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="space-y-6"
          >
            <ServicesHeader onAddClick={handleOpenAddModal} />

            <ServicesTable
              loading={loading}
              filteredServices={filteredServices}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              packageCountMap={packageCountMap}
              serviceUsageNamesMap={serviceUsageNamesMap}
              expandedServiceIds={expandedServiceIds}
              toggleExpandService={toggleExpandService}
              handleToggleStatus={handleToggleStatus}
              handleEdit={handleOpenEditModal}
              handleDelete={handleDelete}
            />
          </motion.div>
        ) : (
          <motion.div
            key="services-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full"
          >
            <ServiceFormModal
              isOpen={isModalOpen}
              categories={categories}
              services={services}
              editingService={editingService}
              onClose={handleCloseModal}
              onSuccess={handleSuccess}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
