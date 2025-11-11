import React, { lazy } from 'react';

// project import
import MainLayout from 'layout/MainLayout';
import Loadable from 'component/Loadable';
import ProtectedRoute from './ProtectedRoute';

const DashboardDefault = Loadable(lazy(() => import('views/Dashboard/Default')));



const DataNasabahPage = Loadable(lazy(() => import('views/DataNasabah')));
const EditNasabahPage = Loadable(lazy(() => import('views/DataNasabah/EditNasabah')));
const DetailNasabahPage = Loadable(lazy(() => import('views/DataNasabah/DetailNasabah')));

const TypePage = Loadable(lazy(() => import('views/Type')));

const DetailGadaiPage = Loadable(lazy(() => import('views/DetailGadai')));
const TambahDetailGadaiPage = Loadable(lazy(() => import('views/DetailGadai/TambahDetailGadai')));
const EditDetailGadaiPage = Loadable(lazy(() => import('views/DetailGadai/EditDetailGadai')));

const GadaiHpPage = Loadable(lazy(() => import('views/GadaiHp')));
const TambahGadaiHpPage = Loadable(lazy(() => import('views/GadaiHp/TambahGadaiHp')));
const EditGadaiHpPage = Loadable(lazy(() => import('views/GadaiHp/EditGadaiHp')));
const DetailGadaiHpPage = Loadable(lazy(() => import('views/GadaiHp/DetailGadaiHp')));

const GadaiPerhiasanPage = Loadable(lazy(() => import('views/GadaiPerhiasan')));
const TambahGadaiPerhiasanPage = Loadable(lazy(() => import('views/GadaiPerhiasan/TambahGadaiPerhiasan')));
const EditGadaiPerhiasanPage = Loadable(lazy(() => import('views/GadaiPerhiasan/EditGadaiPerhiasan')));
const DetailGadaiPerhiasanPage = Loadable(lazy(() => import('views/GadaiPerhiasan/DetailGadaiPerhiasan')));


const GadaiLogamMuliaPage = Loadable(lazy(() => import('views/GadaiLogamMulia')));
const TambahGadaiLogamMuliaPage = Loadable(lazy(() => import('views/GadaiLogamMulia/TambahGadaiLogamMulia')));
const EditGadaiLogamMuliaPage = Loadable(lazy(() => import('views/GadaiLogamMulia/EditGadaiLogamMulia')));
const DetailGadaiLogamMuliaPage = Loadable(lazy(() => import('views/GadaiLogamMulia/DetailLogamMulia')));

const GadaiRetroPage = Loadable(lazy(() => import('views/GadaiRetro')));
const EditGadaiRetroPage = Loadable(lazy(() => import('views/GadaiRetro/EditGadaiRetro')));
const TambahGadaiRetroPage = Loadable(lazy(() => import('views/GadaiRetro/TambahGadaiRetro')));
const DetailGadaiRetroPage = Loadable(lazy(() => import('views/GadaiRetro/DetailGadaiRetro')));


const PerpanjanganTempoPage = Loadable(lazy(() => import('views/PerpanjanganTempo')));
const TambahPerpanjanganTempo = Loadable(lazy(() => import('views/PerpanjanganTempo/TambahPerpanjanganTempo')));
const EditPerpanjanganTempoPage = Loadable(lazy(() => import('views/PerpanjanganTempo/EditPerpanjanganTempo')));

const PrintStrukPage = Loadable(lazy(() => import('views/PrintStruk/PrintStrukAwal')));
const PrintStrukPelunasanPage = Loadable(lazy(() => import('views/PrintStrukPelunasan/PrintStrukPelunasan')));
const PrintStrukPerpanjanganPage = Loadable(lazy(() => import('views/PrintStrukPerpanjangan/index')));
const PrintSuratGadaiPage = Loadable(lazy(() => import('views/Print-SBG/index')));
const PrintSuratGadaiEmasPage = Loadable(lazy(() => import('views/Print-SBGEmas/index')));

//add nasabah untuk marketing
const WizardGadaiPage = Loadable(lazy(() => import('views/WizardGadai/index')));

//Approval Chekcer
const ApprovalGadaiPage = Loadable(lazy(() => import('views/Approval/index')));
const DetailApprovalPage = Loadable(lazy(() => import('views/Approval/DetailApproval')));
const EditApprovalPage = Loadable(lazy(() => import('views/Approval/EditApproval')));

const ApprovalHmPage = Loadable(lazy(() => import('views/HM/Approval/index')));
const DetailApprovalHMPage = Loadable(lazy(() => import('views/HM/Approval/DetailApprovalHm')));
const EditApprovalHMPage = Loadable(lazy(() => import('views/HM/Approval/EditApprovalHm')));

const NotificationsPage = Loadable(lazy(() => import('views/Notifications/index')));




// ==============================|| MAIN ROUTES ||============================== //
const MainRoutes = {
  path: '/',
  element: (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  ),
  children: [
    { path: '/', element: <DashboardDefault /> },
    { path: '/dashboard/default', element: <DashboardDefault /> },
    { path: '/data-nasabah', element: <DataNasabahPage /> },
    { path: '/edit-nasabah/:id', element: <EditNasabahPage /> },
    { path: '/detail-nasabah/:id', element: <DetailNasabahPage /> },
    { path: '/type', element: <TypePage /> },
    { path: '/detail-gadai', element: <DetailGadaiPage /> },
    { path: '/tambah-detail-gadai', element: <TambahDetailGadaiPage /> },
    { path: '/edit-detail-gadai/:id', element: <EditDetailGadaiPage /> },
    { path: '/gadai-hp', element: <GadaiHpPage /> },
    { path: '/tambah-gadai-hp', element: <TambahGadaiHpPage /> },
    { path: '/edit-gadai-hp/:id', element: <EditGadaiHpPage /> },
    { path: '/detail-gadai-hp/:id', element: <DetailGadaiHpPage /> },
    { path: '/gadai-perhiasan', element: <GadaiPerhiasanPage /> },
    { path: '/tambah-gadai-perhiasan', element: <TambahGadaiPerhiasanPage /> },
    { path: '/edit-gadai-perhiasan/:id', element: <EditGadaiPerhiasanPage /> },
    { path: '/detail-gadai-perhiasan/:id', element: <DetailGadaiPerhiasanPage /> },
    { path: '/gadai-logam-mulia', element: <GadaiLogamMuliaPage /> },
    { path: '/tambah-gadai-logam-mulia', element: <TambahGadaiLogamMuliaPage /> },
    { path: '/edit-gadai-logam-mulia/:id', element: <EditGadaiLogamMuliaPage /> },
    { path: '/detail-gadai-logam-mulia/:id', element: <DetailGadaiLogamMuliaPage /> },
    { path: '/gadai-retro', element: <GadaiRetroPage /> },
    { path: '/tambah-gadai-retro', element: <TambahGadaiRetroPage /> },
    { path: '/edit-gadai-retro/:id', element: <EditGadaiRetroPage /> },
    { path: '/detail-gadai-retro/:id', element: <DetailGadaiRetroPage /> },
    { path: '/perpanjangan-tempo', element: <PerpanjanganTempoPage /> },
    { path: '/tambah-perpanjangan-tempo', element: <TambahPerpanjanganTempo /> },
    { path: '/edit-perpanjangan-tempo/:id', element: <EditPerpanjanganTempoPage /> },
    { path: '/print-struk-awal/:id', element: <PrintStrukPage/> },
    { path: '/print-struk-pelunasan/:id', element: <PrintStrukPelunasanPage/> },
    { path: '/print-struk-perpanjangan/:id', element: <PrintStrukPerpanjanganPage/> },
    { path: '/print-surat-bukti-gadai-hp/:id', element: <PrintSuratGadaiPage/> },
    { path: '/print-surat-bukti-gadai-emas/:id', element: <PrintSuratGadaiEmasPage/> },
    { path: '/full-submit', element: <WizardGadaiPage/> },
    { path: '/approval-gadai', element: <ApprovalGadaiPage/> },
    { path: '/approval-gadai-detail/:detailGadaiId', element: <DetailApprovalPage/> },
    { path: '/approval-gadai-edit/:detailGadaiId', element: <EditApprovalPage/> },
    { path: '/approval-hm-gadai', element: <ApprovalHmPage/> },
    { path: '/approval-hm-gadai-detail/:detailGadaiId', element: <DetailApprovalHMPage/> },
    { path: '/approval-hm-gadai-edit/:detailGadaiId', element: <EditApprovalHMPage/> },
    { path: '/notifications', element: <NotificationsPage/> },


  ]
};

export default MainRoutes;
