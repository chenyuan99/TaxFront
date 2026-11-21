import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, CheckCircle, XCircle } from 'lucide-react';
import { auth } from '../firebase';
import {
    countUnread,
    notificationService,
    type AppNotification,
} from '../services/notificationService';
import {
    enablePush,
    getPushPermission,
    refreshPushToken,
    type PushPermission,
} from '../services/pushService';

/**
 * Bell + dropdown for job notifications pushed by the backend.
 *
 * The subscription is keyed to auth state rather than `auth.currentUser`, which
 * is still null on the first render after a reload while the SDK restores the
 * session.
 */
export function NotificationBell() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [pushPermission, setPushPermission] = useState<PushPermission | null>(null);
    const [enablingPush, setEnablingPush] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        let unsubscribeFeed: (() => void) | undefined;

        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            unsubscribeFeed?.();
            unsubscribeFeed = undefined;

            if (!user) {
                setNotifications([]);
                return;
            }

            unsubscribeFeed = notificationService.subscribeToUserNotifications(
                user.uid,
                setNotifications,
                (error) => console.error('Error fetching notifications:', error)
            );

            // Tokens rotate; re-register silently for a user who already opted in.
            void refreshPushToken();
        });

        return () => {
            unsubscribeFeed?.();
            unsubscribeAuth();
        };
    }, []);

    useEffect(() => {
        void getPushPermission().then(setPushPermission);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = countUnread(notifications);

    const handleOpenNotification = async (notification: AppNotification) => {
        setIsOpen(false);
        navigate('/jobs');
        if (!notification.read) {
            try {
                await notificationService.markAsRead(notification.id);
            } catch (error) {
                console.error('Error marking notification read:', error);
            }
        }
    };

    const handleEnablePush = async () => {
        setEnablingPush(true);
        try {
            setPushPermission(await enablePush());
        } catch (error) {
            console.error('Error enabling push notifications:', error);
            setPushPermission(await getPushPermission());
        } finally {
            setEnablingPush(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead(notifications);
        } catch (error) {
            console.error('Error marking notifications read:', error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-1 rounded-full text-gray-400 hover:text-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                aria-label={
                    unreadCount > 0
                        ? `View notifications, ${unreadCount} unread`
                        : 'View notifications'
                }
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-red-600 text-white text-[0.65rem] font-semibold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50">
                    <div className="flex items-center justify-between px-4 py-3">
                        <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-indigo-600 hover:text-indigo-900"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                        {notifications.map((notification) => (
                            <button
                                key={notification.id}
                                onClick={() => handleOpenNotification(notification)}
                                className={`w-full text-left px-4 py-3 flex items-start space-x-3 hover:bg-gray-50 ${
                                    notification.read ? '' : 'bg-indigo-50/60'
                                }`}
                            >
                                {notification.type === 'job_completed' ? (
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {notification.title}
                                    </p>
                                    <p className="text-xs text-gray-600 break-words">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </button>
                        ))}

                        {notifications.length === 0 && (
                            <div className="px-4 py-8 text-center">
                                <Bell className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                                <p className="text-sm text-gray-500">You're all caught up</p>
                            </div>
                        )}
                    </div>

                    {/*
                      * Browser push covers what the list above cannot: a job that
                      * finishes after the tab is closed. Only offered where it can
                      * actually work, and only from this click — permission
                      * prompts fired on page load get penalised by browsers.
                      */}
                    {pushPermission === 'default' && (
                        <div className="px-4 py-3">
                            <button
                                onClick={handleEnablePush}
                                disabled={enablingPush}
                                className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <Bell className="h-4 w-4 mr-2" />
                                {enablingPush ? 'Enabling…' : 'Notify me when jobs finish'}
                            </button>
                        </div>
                    )}

                    {pushPermission === 'denied' && (
                        <div className="px-4 py-3 flex items-start space-x-2 text-xs text-gray-500">
                            <BellOff className="h-4 w-4 flex-shrink-0 mt-0.5 text-gray-400" />
                            <span>
                                Browser notifications are blocked for this site. Re-enable them in
                                your browser's site settings to get alerts when a tab isn't open.
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
