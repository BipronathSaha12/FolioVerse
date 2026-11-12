import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminDashboardModal } from '../components/AdminDashboardModal';

export const AdminDashboardPage = ({ onOpenAddBook, onEditBook, onRefreshCatalog }) => {
  const navigate = useNavigate();

  return (
    <AdminDashboardModal
      isOpen={true}
      onClose={() => navigate('/')}
      onOpenAddBook={onOpenAddBook}
      onEditBook={onEditBook}
      onRefreshCatalog={onRefreshCatalog}
    />
  );
};

