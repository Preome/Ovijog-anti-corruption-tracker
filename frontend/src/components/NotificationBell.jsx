import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, ExternalLink } from 'lucide-react';
import API from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await API.get('/notifications/unread-count/');
      setUnreadCount(response.data.count || 0);
      
      if (isOpen) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await API.get('/notifications/');
      let notificationsData = [];
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        notificationsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        notificationsData = response.data;
      }
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await API.post(`/notifications/${notificationId}/read/`);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.post('/notifications/mark-all-read/');
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      toast.success('সব নোটিফিকেশন রিড করা হয়েছে');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await API.delete(`/notifications/${notificationId}/delete/`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (!notifications.find(n => n.id === notificationId)?.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('নোটিফিকেশন ডিলিট করা হয়েছে');
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Close dropdown
    setIsOpen(false);
    
    // Redirect based on notification type
    if (notification.complaint_id) {
      navigate(`/my-complaints?complaint=${notification.complaint_id}`);
    } else {
      navigate('/my-complaints');
    }
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'border-l-4 border-red-500';
      case 'medium': return 'border-l-4 border-yellow-500';
      default: return 'border-l-4 border-blue-500';
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'complaint_status': return '📋';
      case 'complaint_verified': return '✅';
      case 'complaint_resolved': return '🎉';
      case 'complaint_rejected': return '❌';
      case 'officer_response': return '💬';
      default: return '🔔';
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative text-gray-700 hover:text-blue-600 transition"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">নোটিফিকেশন</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                সব রিড করুন
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">কোনো নোটিফিকেশন নেই</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 border-b hover:bg-gray-50 transition cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''} ${getPriorityColor(notification.priority)}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getNotificationIcon(notification.notification_type)}</span>
                        <span className="font-semibold text-sm text-gray-800">
                          {notification.title}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                      <p className="text-xs text-gray-400">{notification.time_ago}</p>
                    </div>
                    <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-green-600 hover:text-green-700"
                          title="রিড করুন"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-500 hover:text-red-600"
                        title="ডিলিট করুন"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 border-t bg-gray-50 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/my-complaints');
              }}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              সব অভিযোগ দেখুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;