import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SellerDashboardModal } from '../components/SellerDashboardModal';

export const SellerDashboardPage = ({ onOpenAddBook, onEditBook, onRefreshCatalog }) => {
  const navigate = useNavigate();

  return (
    <SellerDashboardModal
      isOpen={true}
      onClose={() => navigate('/')}
      onOpenAddBook={onOpenAddBook}
      onEditBook={onEditBook}
      onRefreshCatalog={onRefreshCatalog}
    />
  );
};

