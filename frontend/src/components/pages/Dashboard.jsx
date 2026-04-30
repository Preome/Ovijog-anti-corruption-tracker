import { useState, useEffect } from 'react';
import API from '../../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function Dashboard() {
  const [stats, setStats] = useState({
    total_applications: 0,
    pending_applications: 0,
    approved_applications: 0,
    complaints_count: 0,
    avg_processing_time: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await API.get('/dashboard/stats/');
      setStats(response.data);
    } catch (error) {
      toast.error('স্ট্যাটিসটিক্স লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  // Pie chart data for application status
  const pieData = {
    labels: ['প্রক্রিয়াধীন', 'অনুমোদিত', 'বাতিল'],
    datasets: [
      {
        data: [stats.pending_applications, stats.approved_applications, 0],
        backgroundColor: ['#FFA726', '#66BB6A', '#EF5350'],
        borderWidth: 1,
      },
    ],
  };

  // Bar chart data for service types
  const barData = {
    labels: ['পাসপোর্ট', 'ড্রাইভিং লাইসেন্স', 'জন্ম নিবন্ধন', 'ট্যাক্স আইডি'],
    datasets: [
      {
        label: 'আবেদনের সংখ্যা',
        data: [12, 8, 15, 5],
        backgroundColor: '#42A5F5',
        borderRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'সেবা অনুযায়ী আবেদন',
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">স্বচ্ছতা ড্যাশবোর্ড</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-blue-600 text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold">{stats.total_applications}</div>
            <div className="text-gray-600">মোট আবেদন</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-yellow-600 text-3xl mb-2">⏳</div>
            <div className="text-2xl font-bold">{stats.pending_applications}</div>
            <div className="text-gray-600">প্রক্রিয়াধীন</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-green-600 text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold">{stats.approved_applications}</div>
            <div className="text-gray-600">অনুমোদিত</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-red-600 text-3xl mb-2">⚠️</div>
            <div className="text-2xl font-bold">{stats.complaints_count}</div>
            <div className="text-gray-600">অভিযোগ</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">আবেদনের অবস্থা</h2>
            <div className="max-w-md mx-auto">
              <Pie data={pieData} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <Bar options={options} data={barData} />
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">সাম্প্রতিক অভিযোগ</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
              <p className="text-sm text-gray-600">২৪ ঘণ্টা আগে</p>
              <p className="font-semibold">পাসপোর্ট অফিস, ঢাকা</p>
              <p className="text-gray-700">ঘুষ দাবির অভিযোগ প্রাপ্ত হয়েছে</p>
            </div>
            <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
              <p className="text-sm text-gray-600">৩ দিন আগে</p>
              <p className="font-semibold">বিআরটিএ, চট্টগ্রাম</p>
              <p className="text-gray-700">ড্রাইভিং লাইসেন্স জটিলতার অভিযোগ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;