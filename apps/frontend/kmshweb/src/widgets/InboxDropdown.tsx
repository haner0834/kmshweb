import { use, useState } from "react";
import { useAuth } from "../auth/AuthContext";

const NitoficationInboxIcon = ({ unreadCount }: { unreadCount: number }) => {
  return (
    <div className="indicator">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <span className="badge badge-xs badge-primary indicator-item">
        {unreadCount}
      </span>
    </div>
  );
};

const InboxDropdown = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { accessToken } = useAuth();

  // TODO: These two functions are placeholder

  const getUnreadNotificationCount = async (): Promise<number> => {
    const res = await fetch("/api/student/notifications/count?role=unread", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();
    return data.unreadNotificationCount;
  };

  const getFirst5Notifications = async () => {
    const res = await fetch("/api/student/notifications?page=1&pagesize=5", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();
    setNotifications(data.notifications);
  };

  const unreadCount = use(getUnreadNotificationCount());

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        <NitoficationInboxIcon unreadCount={unreadCount} />
      </div>

      <ul
        onClick={getFirst5Notifications}
        tabIndex={0}
        className="dropdown-content menu bg-base-200 rounded-box z-1 w-52 p-2 shadow-md"
      >
        {notifications.map((notification) => (
          <li>
            <a>{notification.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InboxDropdown;
