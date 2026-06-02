'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CheckCircle, XCircle } from 'lucide-react'

function SwitchToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-10 h-6 rounded-full transition-all relative ${checked ? 'bg-accent' : 'bg-white/10'}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-5' : 'left-1'}`} />
    </button>
  )
}

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name: 'Demo User', username: 'demouser', bio: 'Building in public. Founder at XLink.' })
  const [xConnected, setXConnected] = useState(false)
  const [linkedinConnected, setLinkedinConnected] = useState(false)
  const [notifs, setNotifs] = useState({ weeklyDigest: true, postPublished: true, engageAlerts: false })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white mb-1">Settings</h1>
        <p className="text-sm text-white/40">Manage your profile and account preferences.</p>
      </div>

      {/* Profile */}
      <div className="card-x card-gloss p-6 mb-6">
        <h2 className="text-base font-bold text-white mb-5">Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-2xl font-black text-accent-light">
            {profile.name[0]}
          </div>
          <div>
            <Button variant="secondary" size="sm">Upload avatar</Button>
            <p className="text-xs text-white/30 mt-1.5">PNG, JPG up to 2MB</p>
          </div>
        </div>
        <div className="space-y-4">
          <Input label="Full name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
          <Input label="Username" value={profile.username} onChange={e => setProfile(p => ({ ...p, username: e.target.value }))} />
          <div>
            <label className="text-sm text-white/70 font-medium block mb-1.5">Bio</label>
            <textarea
              value={profile.bio}
              onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-accent resize-none"
            />
          </div>
          <Button onClick={handleSave}>
            {saved ? 'Saved!' : 'Save changes'}
          </Button>
        </div>
      </div>

      {/* Connected accounts */}
      <div className="card-x card-gloss p-6 mb-6">
        <h2 className="text-base font-bold text-white mb-5">Connected Accounts</h2>
        <div className="space-y-4">
          {[
            { label: 'X (Twitter)', icon: 'X', connected: xConnected, toggle: setXConnected },
            { label: 'LinkedIn', icon: 'in', connected: linkedinConnected, toggle: setLinkedinConnected },
          ].map(({ label, icon, connected, toggle }) => (
            <div key={label} className="flex items-center justify-between p-4 bg-white/3 border border-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${icon === 'X' ? 'bg-white text-black' : 'bg-blue-600 text-white'}`}>
                  {icon}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{label}</div>
                  <div className="flex items-center gap-1.5 text-xs mt-0.5">
                    {connected ? (
                      <><CheckCircle size={11} className="text-green-400" /><span className="text-green-400">Connected</span></>
                    ) : (
                      <><XCircle size={11} className="text-white/30" /><span className="text-white/30">Not connected</span></>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant={connected ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => toggle(!connected)}
              >
                {connected ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card-x card-gloss p-6 mb-6">
        <h2 className="text-base font-bold text-white mb-5">Notifications</h2>
        <div className="space-y-4">
          {[
            { key: 'weeklyDigest', label: 'Weekly digest', desc: 'Get a summary of your growth every Monday.' },
            { key: 'postPublished', label: 'Post published', desc: 'Get notified when a scheduled post goes live.' },
            { key: 'engageAlerts', label: 'Engage alerts', desc: 'Get notified about new engagement opportunities.' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="text-xs text-white/30 mt-0.5">{desc}</div>
              </div>
              <SwitchToggle
                checked={notifs[key as keyof typeof notifs]}
                onChange={v => setNotifs(p => ({ ...p, [key]: v }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-3xl border border-red-500/20 p-6 bg-red-500/5">
        <h2 className="text-base font-bold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-white/40 mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
        <Button variant="ghost" className="text-red-400 hover:text-red-300 border border-red-500/20 hover:bg-red-500/10" size="sm">
          Delete account
        </Button>
      </div>
    </div>
  )
}
