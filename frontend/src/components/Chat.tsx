import { useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { CopilotKit } from '@copilotkit/react-core';
import { CopilotSidebar } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';

export function Chat() {
    const chatButtonRef = useRef<HTMLButtonElement>(null);

    return (
        <CopilotKit runtimeUrl="/api/copilotkit">
            <div>
                {/* Floating Chat Button */}
                <CopilotSidebar>
                    <button
                        ref={chatButtonRef}
                        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-[#00AAFF] hover:bg-[#00395D] transition-all duration-200 z-50"
                        aria-label="Chat with us"
                    >
                        <MessageSquare className="h-6 w-6 text-white" />
                    </button>
                </CopilotSidebar>
            </div>
        </CopilotKit>
    );
}