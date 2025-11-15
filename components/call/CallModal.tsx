'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'
import { Phone, Video, Mic, MicOff, Volume2, VolumeX, X, PhoneOff } from 'lucide-react'
import { useState, useEffect } from 'react'

interface CallModalProps {
  user: {
    id: string | number
    name: string
    username: string
    avatar: string
    online: boolean
  }
  type: 'audio' | 'video'
  onClose: () => void
  onAccept?: () => void
  incoming?: boolean
}

export function CallModal({ user, type, onClose, onAccept, incoming = false }: CallModalProps) {
  const [muted, setMuted] = useState(false)
  const [speakerOff, setSpeakerOff] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [accepted, setAccepted] = useState(!incoming)

  useEffect(() => {
    if (accepted && !incoming) {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [accepted, incoming])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAccept = () => {
    setAccepted(true)
    if (onAccept) {
      onAccept()
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
        <motion.div
          className="w-full max-w-md mx-4 glass-strong rounded-apple-lg shadow-apple-lg border border-apple-gray-200 dark:border-apple-gray-800 overflow-hidden"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div className="p-6 border-b border-apple-gray-200 dark:border-apple-gray-800 bg-apple-gray-50 dark:bg-apple-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-apple-primary">
                {type === 'video' ? 'Cuộc gọi video' : 'Cuộc gọi'}
              </h2>
              <motion.button
                className="p-2 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
              >
                <X className="w-5 h-5 text-apple-secondary" />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 text-center bg-white dark:bg-black">
            <motion.div
              className="mb-6 flex justify-center"
              animate={{ scale: accepted ? [1, 1.1, 1] : 1 }}
              transition={{ repeat: accepted ? Infinity : 0, duration: 2 }}
            >
              <Avatar src={user.avatar} size="xl" online={user.online} />
            </motion.div>
            <h3 className="text-2xl font-bold text-apple-primary mb-2">{user.name}</h3>
            <p className="text-apple-tertiary mb-4">{user.username}</p>
            {accepted ? (
              <p className="text-lg font-medium text-apple-secondary mb-6">
                {formatDuration(callDuration)}
              </p>
            ) : incoming ? (
              <p className="text-lg font-medium text-apple-secondary mb-6">
                Đang gọi đến...
              </p>
            ) : (
              <p className="text-lg font-medium text-apple-secondary mb-6">
                Đang gọi...
              </p>
            )}

            {/* Video Preview (if video call) */}
            {type === 'video' && accepted && (
              <div className="mb-6 rounded-apple-lg overflow-hidden bg-apple-gray-100 dark:bg-apple-gray-800 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <Video className="w-16 h-16 text-apple-tertiary mx-auto mb-2" />
                  <p className="text-sm text-apple-tertiary">Video preview</p>
                </div>
              </div>
            )}

            {/* Controls */}
            {accepted ? (
              <div className="flex items-center justify-center space-x-4">
                <motion.button
                  className={`p-4 rounded-full transition-colors ${
                    muted
                      ? 'bg-red-500 text-white'
                      : 'bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-primary hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMuted(!muted)}
                >
                  {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </motion.button>
                <motion.button
                  className={`p-4 rounded-full transition-colors ${
                    speakerOff
                      ? 'bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-primary hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700'
                      : 'bg-blue-500 text-white'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSpeakerOff(!speakerOff)}
                >
                  {speakerOff ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </motion.button>
                <motion.button
                  className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                >
                  <PhoneOff className="w-6 h-6" />
                </motion.button>
              </div>
            ) : incoming ? (
              <div className="flex items-center justify-center space-x-4">
                <motion.button
                  className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                >
                  <PhoneOff className="w-6 h-6" />
                </motion.button>
                <motion.button
                  className="p-4 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAccept}
                >
                  <Phone className="w-6 h-6" />
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <motion.button
                  className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                >
                  <PhoneOff className="w-6 h-6" />
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
  )
}

