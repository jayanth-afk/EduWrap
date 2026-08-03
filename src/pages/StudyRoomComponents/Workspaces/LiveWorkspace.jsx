import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Maximize, SmilePlus, Upload, Download, X } from 'lucide-react';
import { useRoom } from '../../../contexts/RoomContext';
import { Avatar } from '../../../components/ui/Avatar';
import { useState, useRef } from 'react';

export default function LiveWorkspace() {
  const { activeRoom, activeClassroom } = useRoom();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [presentedPdf, setPresentedPdf] = useState(null);
  const containerRef = useRef(null);

  if (!activeClassroom) return null;

  const participants = activeRoom.members.filter(m => m.status === 'online').slice(0, 4);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const [notification, setNotification] = useState(null);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUploadPdf = () => {
    setPresentedPdf({
      title: 'Chapter_4_Kinematics.pdf',
      url: '#',
      pages: 12
    });
    showNotification("Note uploaded successfully! Saved to Classroom Resources.");
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-black relative">
      {/* Header overlay */}
      <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 flex justify-between items-start pointer-events-none">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500 text-white">Live</span>
            <span className="text-white font-medium text-sm drop-shadow-md">{activeClassroom.name}</span>
          </div>
          <p className="text-white/70 text-xs mt-1">{activeRoom.name}</p>
        </div>
        <button onClick={toggleFullScreen} className="p-2 rounded-lg bg-black/40 text-white hover:bg-white/20 transition-colors pointer-events-auto backdrop-blur-md">
          <Maximize size={16} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex p-2 sm:p-4 pt-14 sm:pt-16 pb-20 sm:pb-24 gap-3 sm:gap-4 h-full">
        {presentedPdf ? (
          <>
            {/* Presentation View */}
            <div className="flex-[3] relative bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">PDF</div>
                  <span className="text-sm font-medium text-gray-800">{presentedPdf.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => showNotification("Downloading PDF notes...")} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer" title="Download Notes">
                    <Download size={16} />
                  </button>
                  <button onClick={() => setPresentedPdf(null)} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer" title="Stop Presenting">
                    <X size={16} />
                  </button>
                </div>
              </div>
              {notification && (
                <div className="bg-green-600 text-white text-xs font-semibold px-4 py-1.5 text-center transition-all">
                  {notification}
                </div>
              )}
              <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
                {/* Simulated PDF Content */}
                <div className="w-full max-w-2xl bg-white shadow-md aspect-[1/1.4] p-12 text-gray-800 flex flex-col">
                  <h1 className="text-3xl font-bold mb-6">Chapter 4: Kinematics</h1>
                  <p className="text-lg mb-4">Kinematics is the branch of mechanics that describes the motion of points, bodies, and systems of bodies without considering the forces that cause them to move.</p>
                  <div className="h-px bg-gray-200 my-4"></div>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Position and Displacement</li>
                    <li>Velocity and Speed</li>
                    <li>Acceleration</li>
                  </ul>
                  <div className="mt-auto text-center text-xs text-gray-400">Page 1 of {presentedPdf.pages}</div>
                </div>
              </div>
            </div>
            {/* Sidebar Video Grid */}
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar">
              {participants.map((p, i) => (
                <div key={p.id} className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video border-2 border-transparent hover:border-[color:oklch(0.58_0.22_var(--accent-hue))] transition-colors">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar initials={p.avatar} size="lg" className="w-16 h-16 text-lg" />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-white">{p.name}</span>
                    {i === 1 && <MicOff size={10} className="text-red-400" />}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Standard Video Grid */
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {participants.map((p, i) => (
              <div key={p.id} className={`relative rounded-2xl overflow-hidden bg-gray-900 border-2 ${i === 0 ? 'border-[color:oklch(0.58_0.22_var(--accent-hue))] shadow-[0_0_15px_oklch(0.58_0.22_var(--accent-hue)_/_0.5)]' : 'border-transparent'}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Avatar initials={p.avatar} size="lg" className="w-20 h-20 text-xl" />
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="text-xs font-medium text-white">{p.name}</span>
                  {i === 1 && <MicOff size={12} className="text-red-400" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-6 inset-x-0 flex justify-center z-20 pointer-events-none">
        <div className="flex items-center gap-2 sm:gap-3 bg-black/60 backdrop-blur-xl border border-white/10 p-1.5 sm:p-2 rounded-2xl pointer-events-auto shadow-2xl flex-wrap justify-center">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          
          <button 
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-colors ${isVideoOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
            title={isVideoOff ? "Turn on camera" : "Turn off camera"}
          >
            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
          
          <div className="w-px h-8 bg-white/10 mx-1"></div>
          
          <button onClick={handleUploadPdf} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.2)] text-[color:oklch(0.58_0.22_var(--accent-hue))] hover:bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.3)] flex items-center justify-center transition-colors" title="Share Notes/PDF">
            <Upload size={20} />
          </button>
          
          <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors" title="Share Screen">
            <MonitorUp size={20} />
          </button>
          
          <button className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 text-white hover:bg-white/20 items-center justify-center transition-colors" title="React">
            <SmilePlus size={20} />
          </button>
          
          <div className="w-px h-8 bg-white/10 mx-1"></div>
          
          <button className="px-3 sm:px-6 h-10 sm:h-12 rounded-xl bg-red-500 text-white hover:bg-red-600 flex items-center justify-center transition-colors font-medium text-sm" title="Leave Session">
            <span className="hidden sm:inline">Leave</span>
            <PhoneOff size={18} className="sm:hidden" />
          </button>
        </div>
      </div>
    </div>
  );
}