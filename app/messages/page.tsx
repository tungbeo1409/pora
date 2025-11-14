'use client'

import { GlobalLayout } from '@/components/layout/GlobalLayout'
import { AppleCard } from '@/components/ui/AppleCard'
import { Avatar } from '@/components/ui/Avatar'
import { AppleInput } from '@/components/ui/AppleInput'
import { Send } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

const conversations = [
  {
    id: 1,
    user: {
      name: 'Nguyễn Văn A',
      username: '@nguyenvana',
      avatar: 'https://i.pravatar.cc/150?img=1',
      online: true,
    },
    lastMessage: 'Cảm ơn bạn đã giúp đỡ!',
    time: '2 phút trước',
    unread: 2,
  },
  {
    id: 2,
    user: {
      name: 'Trần Thị B',
      username: '@tranthib',
      avatar: 'https://i.pravatar.cc/150?img=1',
      online: false,
    },
    lastMessage: 'Hẹn gặp lại vào tuần sau nhé',
    time: '1 giờ trước',
    unread: 0,
  },
  {
    id: 3,
    user: {
      name: 'Lê Văn C',
      username: '@levanc',
      avatar: 'https://i.pravatar.cc/150?img=1',
      online: true,
    },
    lastMessage: 'Dự án đang tiến triển tốt',
    time: '3 giờ trước',
    unread: 1,
  },
]

const messages = [
  { id: 1, text: 'Xin chào! Bạn có khỏe không?', sender: 'other', time: '10:30' },
  { id: 2, text: 'Chào bạn! Mình khỏe, cảm ơn bạn đã hỏi thăm.', sender: 'me', time: '10:32' },
  { id: 3, text: 'Tuyệt vời! Bạn có rảnh để thảo luận về dự án không?', sender: 'other', time: '10:33' },
  { id: 4, text: 'Có chứ! Mình đang rảnh. Bạn muốn bắt đầu từ đâu?', sender: 'me', time: '10:35' },
  { id: 5, text: 'Cảm ơn bạn đã giúp đỡ!', sender: 'other', time: '10:40' },
]

export default function MessagesPage() {
  const [selectedChat, setSelectedChat] = useState(1)
  const [message, setMessage] = useState('')

  return (
    <GlobalLayout>
      <div className="max-w-6xl mx-auto">
        <AppleCard className="p-0 overflow-hidden">
          <div className="flex h-[calc(100vh-12rem)]">
            {/* Conversations List */}
            <div className="w-full md:w-80 border-r border-apple-gray-200 dark:border-apple-gray-800 overflow-y-auto">
              <div className="p-4 border-b border-apple-gray-200 dark:border-apple-gray-800">
                <h2 className="text-xl font-semibold text-apple-primary">Tin nhắn</h2>
              </div>
              <div className="divide-y divide-apple-gray-200 dark:divide-apple-gray-800">
                {conversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedChat === conversation.id
                        ? 'bg-apple-gray-100 dark:bg-apple-gray-800'
                        : 'hover:bg-apple-gray-50 dark:hover:bg-apple-gray-900'
                    }`}
                    onClick={() => setSelectedChat(conversation.id)}
                    whileHover={{ x: 2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar src={conversation.user.avatar} size="md" online={conversation.user.online} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm text-apple-primary truncate">
                            {conversation.user.name}
                          </p>
                          <span className="text-xs text-apple-tertiary">{conversation.time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-apple-secondary truncate">{conversation.lastMessage}</p>
                          {conversation.unread > 0 && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-medium">
                              {conversation.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-apple-gray-200 dark:border-apple-gray-800">
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={conversations.find((c) => c.id === selectedChat)?.user.avatar || ''}
                    size="md"
                    online={conversations.find((c) => c.id === selectedChat)?.user.online}
                  />
                  <div>
                    <p className="font-semibold text-apple-primary">
                      {conversations.find((c) => c.id === selectedChat)?.user.name}
                    </p>
                    <p className="text-sm text-apple-tertiary">
                      {conversations.find((c) => c.id === selectedChat)?.user.online ? 'Đang hoạt động' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-apple-gray-50 dark:bg-apple-gray-900">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-apple-lg ${
                        msg.sender === 'me'
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : 'bg-white dark:bg-apple-gray-800 text-apple-primary rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender === 'me' ? 'text-blue-100' : 'text-apple-tertiary'
                        }`}
                      >
                        {msg.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-apple-gray-200 dark:border-apple-gray-800">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-apple-lg bg-apple-gray-100 dark:bg-apple-gray-800 border border-apple-gray-200 dark:border-apple-gray-700 text-apple-primary placeholder:text-apple-tertiary focus:outline-none focus:ring-2 focus:ring-apple-gray-400 dark:focus:ring-apple-gray-600"
                  />
                  <motion.button
                    className="p-2 rounded-apple-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </AppleCard>
      </div>
    </GlobalLayout>
  )
}

