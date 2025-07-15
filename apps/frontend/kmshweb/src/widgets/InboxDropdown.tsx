import { Suspense, use, useEffect, useState, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import logo from "../assets/react.svg";
import { type Notification, type NotificationIcon } from "../types/student";

export const NotificationInboxIcon = ({
  unreadCount,
}: {
  unreadCount: number;
}) => {
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

      {unreadCount != 0 && (
        <span className="badge badge-xs badge-primary indicator-item">
          {unreadCount}
        </span>
      )}
    </div>
  );
};

const InboxDropdownButtonPlaceholder = () => {
  return (
    <div className="btn btn-circle btn-ghost">
      <NotificationInboxIcon unreadCount={0} />
    </div>
  );
};

const getIcon = (icon: NotificationIcon) => {
  // TODO: Return specific icon for different input
  return logo;
};

const NotificationItem = ({ notification }: { notification: Notification }) => {
  return (
    <li>
      <div className="flex items-center justify-between w-full px-2 py-1 my-1">
        <img src={getIcon(notification.icon)} className="w-5 h-5" />

        <a href={notification.path} className="flex-1">
          {notification.title}
        </a>

        {!notification.isRead && (
          <span className="status status-primary ml-2"></span>
        )}
      </div>
    </li>
  );
};

const getUnreadNotificationCount = async (
  accessToken: string
): Promise<number> => {
  const res = await fetch("/api/student/notifications/count?role=unread", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const result = await res.json();
  return result.data;
};

const getFirst5Notifications = async (
  accessToken: string,
  currentNotifications: Notification[],
  setNotifications: (n: Notification[]) => void
) => {
  const res = await fetch(
    "kmshweb.com/api/student/notifications?page=1&pagesize=5",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const result = await res.json();
  setNotifications([...currentNotifications, ...result.data]);
};

const InboxDropdownContent = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { accessToken } = useAuth();

  if (!accessToken) {
    return <InboxDropdownButtonPlaceholder />;
  }

  const unreadCount = use(getUnreadNotificationCount(accessToken));

  return (
    <div
      onClick={() =>
        getFirst5Notifications(accessToken, notifications, setNotifications)
      }
      className="dropdown dropdown-end"
    >
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        <NotificationInboxIcon unreadCount={unreadCount} />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content block menu bg-base-100 rounded-box z-1 w-70 max-h-50 overflow-y-scroll p-2 shadow-md"
      >
        <p className="uppercase mx-2 text-xs opacity-50 mb-1.5">
          notifications
        </p>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))
        ) : (
          <li>
            <a>There's no earlier notifications</a>
          </li>
        )}
      </ul>
    </div>
  );
};

const InboxDropdown = () => {
  return (
    <Suspense fallback={<InboxDropdownButtonPlaceholder />}>
      <InboxDropdownContent />
    </Suspense>
  );
};

export default InboxDropdown;
