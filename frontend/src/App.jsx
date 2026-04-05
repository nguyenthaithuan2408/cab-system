import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

// --- CUSTOMER PAGES ---
import Splash from './pages/auth/Splash';
import Login from './pages/auth/Login';
import Home from './pages/home/Home';
import Destination from './pages/home/Destination';
import RideOptions from './pages/ride/RideOptions';
import Searching from './pages/ride/Searching';
import Tracking from './pages/ride/Tracking';
import Payment from './pages/payment/Payment';
import Rating from './pages/payment/Rating';

// --- DRIVER PAGES ---
import DriverLogin from './pages/driver/DriverLogin';
import DriverHome from './pages/driver/DriverHome';
import IncomingRide from './pages/driver/IncomingRide';
import ActiveRide from './pages/driver/ActiveRide';
import RideCompleted from './pages/driver/RideCompleted';
import Earnings from './pages/driver/Earnings';

// --- ADMIN PAGES ---
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRides from './pages/admin/AdminRides'; // <-- Đã thêm Quản lý chuyến đi vào đây
import AdminMap from './pages/admin/AdminMap';
// --- LAYOUT 1: KHUNG ĐIỆN THOẠI (Cho Customer & Driver) ---
const MobileLayout = () => {
  return (
    <div className="bg-gray-200 min-h-screen flex items-center justify-center">
      <div className="bg-white w-full max-w-md h-[100dvh] sm:h-[850px] sm:rounded-[2.5rem] sm:border-[14px] border-gray-900 overflow-hidden relative shadow-2xl">
        <Outlet />
      </div>
    </div>
  );
};

// --- LAYOUT 2: FULL MÀN HÌNH (Cho Admin Dashboard) ---
const DesktopLayout = () => {
  return (
    <div className="bg-gray-100 min-h-screen w-full">
      <Outlet />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* NHÁNH 1: DÙNG KHUNG ĐIỆN THOẠI */}
        <Route element={<MobileLayout />}>

          {/* 1.1 - Đường dẫn Customer */}
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/destination" element={<Destination />} />
          <Route path="/ride-options" element={<RideOptions />} />
          <Route path="/searching" element={<Searching />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/rating" element={<Rating />} />

          {/* 1.2 - Đường dẫn Driver */}
          <Route path="/driver" element={<DriverLogin />} />
          <Route path="/driver/home" element={<DriverHome />} />
          <Route path="/driver/incoming" element={<IncomingRide />} />
          <Route path="/driver/active" element={<ActiveRide />} />
          <Route path="/driver/completed" element={<RideCompleted />} />
          <Route path="/driver/earnings" element={<Earnings />} />
        </Route>

        {/* NHÁNH 2: DÙNG FULL MÀN HÌNH DESKTOP */}
        <Route element={<DesktopLayout />}>
          {/* Đường dẫn Admin */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/rides" element={<AdminRides />} /> {/* <-- Đã khai báo đường dẫn Quản lý chuyến đi */}
          <Route path="/admin/map" element={<AdminMap />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;