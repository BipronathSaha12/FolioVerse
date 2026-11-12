import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BuyerDashboardModal } from '../components/BuyerDashboardModal';

export const BuyerDashboardPage = () => {
  const navigate = useNavigate();

  return (
    <BuyerDashboardModal
      isOpen={true}
      onClose={() => navigate('/')}
    />
  );
};

