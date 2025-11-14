'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'
import { Video, Mic, MicOff, Volume2, VolumeX, X, PhoneOff, Maximize2, Minimize2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface VideoCallModalProps {
  user: {
    id: number
    name: string
    username: string
    avatar: string
    online: boolean
  }
  onClose: () => void
  onAccept?: () => void
  incoming?: boolean
}

export function VideoCallModal({ user, onClose, onAccept, incoming = false }: VideoCallModalProps) {
  const [muted, setMuted] = useState(false)
  const [speakerOff, setSpeakerOff] = useState(false)
  const [videoOff, setVideoOff] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [accepted, setAccepted] = useState(!incoming)
  const [minimized, setMinimized] = useState(false)

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

  if (minimized) {
    return (
      <motion.div
        className="fixed bottom-4 right-4 z-[10000] glass-strong rounded-apple-lg shadow-apple-lg border border-apple-gray-200 dark:border-apple-gray-800 overflow-hidden w-64"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="p-4 bg-apple-gray-50 dark:bg-apple-gray-900 flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Avatar src={user.avatar} size="sm" online={user.online} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-apple-primary truncate">{user.name}</p>
              <p className="text-xs text-apple-tertiary">{formatDuration(callDuration)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <motion.button
              className="p-2 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setMinimized(false)}
            >
              <Maximize2 className="w-4 h-4 text-apple-secondary" />
            </motion.button>
            <motion.button
              className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
            >
              <PhoneOff className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="fixed inset-0 z-[10000] bg-black flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
        {/* Remote Video */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          <div className="absolute inset-0">
            <div className="w-full h-full flex items-center justify-center bg-apple-gray-900">
              {videoOff ? (
                <div className="text-center">
                  <Avatar src={user.avatar} size="xl" online={user.online} />
                  <p className="text-white mt-4 text-lg">{user.name}</p>
                </div>
              ) : (
                <div className="text-center">
                  <Video className="w-24 h-24 text-apple-tertiary mx-auto mb-4" />
                  <p className="text-white text-lg">Video stream</p>
                </div>
              )}
            </div>
          </div>

          {/* Local Video (small) */}
          {accepted && (
            <motion.div
              className="absolute top-4 right-4 w-48 h-32 rounded-apple-lg overflow-hidden bg-apple-gray-800 border-2 border-white shadow-apple-lg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-full h-full flex items-center justify-center bg-apple-gray-800">
                <div className="text-center">
                  <Avatar src="https://i.pravatar.cc/150?img=5" size="md" />
                  <p className="text-white text-xs mt-2">Bạn</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Header Info */}
          <div className="absolute top-4 left-4 glass-strong rounded-apple-lg px-4 py-2">
            <div className="flex items-center space-x-3">
              <Avatar src={user.avatar} size="sm" online={user.online} />
              <div>
                <p className="font-semibold text-white text-sm">{user.name}</p>
                {accepted && (
                  <p className="text-xs text-apple-tertiary">{formatDuration(callDuration)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            {accepted ? (
              <div className="flex items-center space-x-4">
                <motion.button
                  className={`p-4 rounded-full transition-colors ${
                    muted
                      ? 'bg-red-500 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMuted(!muted)}
                >
                  {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </motion.button>
                <motion.button
                  className={`p-4 rounded-full transition-colors ${
                    videoOff
                      ? 'bg-red-500 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setVideoOff(!videoOff)}
                >
                  <Video className={`w-6 h-6 ${videoOff ? 'opacity-50' : ''}`} />
                </motion.button>
                <motion.button
                  className={`p-4 rounded-full transition-colors ${
                    speakerOff
                      ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                      : 'bg-blue-500 text-white'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSpeakerOff(!speakerOff)}
                >
                  {speakerOff ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </motion.button>
                <motion.button
                  className="p-4 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMinimized(true)}
                >
                  <Minimize2 className="w-6 h-6" />
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
                  <Video className="w-6 h-6" />
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
        </div>
    </motion.div>
  )
}

