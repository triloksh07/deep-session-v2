'use client'
import { formatTimerDuration } from '@/lib/timeUtils';

// import { Code, CodeIcon, ChevronDown, Flame, Edit, Copy, Trash2, Sun, Moon, BookOpen, BookOpenIcon, TargetIcon, Brain, DumbbellIcon, CoffeeIcon, PlayIcon, StopCircleIcon } from 'lucide-react';
import { StopCircleIcon, CoffeeIcon, PlayIcon } from 'lucide-react';
import { ICON_MAP, IconKey } from '@/config/sessionTypes.config';
import { useSessionStore, SessionType } from '@/store/oldMainSessionStore';
// --- FIX: Import useShallow from the correct path for middleware compatibility ---
import { useShallow } from 'zustand/react/shallow';
import { useState, useRef, useEffect } from 'react';
// import { SessionType } from '@/store/sessionStore';
import { TimerCardProps, EditableTitleProps } from '@/types/typeDeclaration';

// --- Sub-component for Session Type selection ---
// It no longer needs to fetch its own data. It gets everything via props.
function SessionTypesSelector() {
    const { customSessionTypes, selectedSessionType, setSelectedSessionType } = useSessionStore(
        useShallow(state => ({
            customSessionTypes: state.customSessionTypes,
            selectedSessionType: state.selectedSessionType,
            setSelectedSessionType: state.setSelectedSessionType,
        }))
    );

    const classNames = (...classes: string[]) => classes.filter(Boolean).join(' ');

    return (
        <div className="w-80 px-1">
            <h3 className="mb-2" >Select a Session Type:</h3>
            <div className="flex flex-wrap justify-start gap-2">
                {customSessionTypes.map((type: SessionType) => {
                    const IconComponent = ICON_MAP[type.icon];
                    const isSelected = selectedSessionType === type.id;

                    return (
                        <button
                            key={type.id}
                            onClick={() => setSelectedSessionType(isSelected == false ? type.id : '')}
                            className={classNames(
                                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5',
                                isSelected ? `${type.color} text-white shadow-md` : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
                            )}
                        >
                            {/* The check for IconComponent is still a good practice */}
                            {IconComponent && <IconComponent size={14} />}
                            {type.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function EditableTitle({ value, onChange, disabled = false }: EditableTitleProps) {
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
    };

    return (
        <div className="w-full">
            {isEditing && !disabled ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="What are you focusing on?"
                    onBlur={handleBlur}
                    className="w-full bg-[#2a2a2a] text-white placeholder-gray-400 rounded-lg px-4 py-3 border border-transparent focus:border-[#8A2BE2] focus:ring-0 outline-none"
                />
            ) : (
                <span
                    onClick={() => !disabled && setIsEditing(true)}
                    className={`block w-full text-white px-4 py-3 rounded-lg cursor-pointer transition hover:bg-[#2a2a2a]/50 ${disabled ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                >
                    {value || 'Click to add a title'}
                </span>
            )}
        </div>
    );
}



const classNames = (...classes: string[]) => classes.filter(Boolean).join(' ');

// --- Main TimerCard Component ---
// interface TimerCardProps {
//     sessionState: 'idle' | 'running' | 'paused';
//     localDescription: string;
//     setLocalDescription: (value: string) => void;
//     selectedSessionType: string | null;
//     setSelectedSessionType: (id: string | '') => void;
//     handleStart: () => void;
//     displayTime: number;
//     displayBreakTime: number;
//     handleToggleBreak: () => void;
//     handleEnd: () => void;
// }

// Today Screen Components
function TimerCard({
    sessionState,
    localDescription,
    setLocalDescription,
    handleStart,
    displayTime,
    displayBreakTime,
    handleToggleBreak,
    handleEnd
}: TimerCardProps) {

    const { customSessionTypes, selectedSessionType, setSelectedSessionType } = useSessionStore(
        useShallow(state => ({
            customSessionTypes: state.customSessionTypes,
            selectedSessionType: state.selectedSessionType,
            setSelectedSessionType: state.setSelectedSessionType,
        }))
    );

    return (
        <div className="bg-[#1E1E1E] rounded-2xl p-6 shadow-lg border border-white/10 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-bl from-[#8A2BE2]/20 to-transparent rounded-full"></div>
            {sessionState === 'idle' ? (
                <div className="flex flex-col items-center justify-center h-full">
                    <h2 className="text-0.5xl font-bold text-center text-gray-200">Start a New Focus Session</h2>
                    <div className="text-center my-6">
                        {/* <h1 className="text-5xl font-bold text-white tracking-wider">00:00:00</h1> */}
                    </div>
                    <input
                        type="text"
                        value={localDescription}
                        onChange={(e) => setLocalDescription(e.target.value)}
                        placeholder="What are you focusing on?"
                        className="w-full bg-[#2a2a2a] text-white placeholder-gray-400 rounded-lg px-4 py-3 mb-6 border border-transparent focus:border-[#8A2BE2] focus:ring-0 outline-none"
                    />
                    <div className="[w-80%] flex justify-center space-x-2 mb-6">
                        {/* <SessionTypes /> */}
                        <SessionTypesSelector />
                    </div>
                    <div className="flex justify-center items-center space-x-4">
                        {/* <button className="px-6 py-3 rounded-full border border-white/20 text-white font-bold text-base hover:bg-white/10 transition-colors">Break</button> */}
                        <button onClick={handleStart} className="px-10 py-4 rounded-full bg-gradient-to-r from-[#8A2BE2] to-[#5D3FD3] text-white font-bold text-base shadow-lg shadow-[#8A2BE2]/30 hover:opacity-90 transition-opacity cursor-pointer">Start Focus</button>
                        {/* <button className="px-6 py-3 rounded-full border border-white/20 text-white font-bold text-base hover:bg-white/10 transition-colors">End</button> */}
                    </div>
                </div>
            ) : (
                // Active State: Timer Display
                <div className="flex flex-col items-center space-y-1">
                    <div className="flex items-center space-x-3 space-y-2">
                        {/* {selectedSessionType && (
                            <div className="mt-2 inline-block bg-purple-700/30 text-purple-300 text-xs font-semibold px-3 py-1 rounded-full">
                                {selectedSessionType}
                            </div>
                        )} */}
                        <div className="w-full flex flex-col items-center space-y-2 mb-4">
                            {/* <input
                                type="text"
                                value={localDescription}
                                onChange={(e) => setLocalDescription(e.target.value)}
                                placeholder="What are you focusing on?"
                                className="w-full bg-[#2a2a2a] text-white placeholder-gray-400 rounded-lg px-4 py-3 mb-4 border border-transparent focus:border-[#8A2BE2] focus:ring-0 outline-none"
                            />*/}
                            {/* <span className='pb-2 text-normal text text-center font-semibold  text-gray-200'>{localDescription}</span>  */}
                            <EditableTitle
                                value={localDescription}
                                onChange={setLocalDescription}
                                disabled={sessionState === 'paused'} // optional: lock editing during breaks
                            />
                        </div>
                    </div>
                    <div className="font-mono text-5xl lg:text-5xl font-bold tracking-tighter text-white mb-4">
                        {formatTimerDuration(displayTime)}
                    </div>
                    <div className="text-purple-400 font-semibold mb-6">
                        {sessionState === 'paused' && (
                            <div className="absolute top-4 right-4 flex items-center space-x-2 text-green-400 font-semibold animate-pulse">
                                <CoffeeIcon className="w-4 h-4" />
                                <span>ON Break</span>
                            </div>
                        )}
                        Break Time: {formatTimerDuration(displayBreakTime)}
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={handleToggleBreak}
                            className={classNames(
                                "px-6 py-3 rounded-lg font-bold flex items-center space-x-2 transition-all cursor-pointer",
                                sessionState === 'running' ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-green-500 text-white "
                            )}
                        >
                            {sessionState === 'running' ? <CoffeeIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                            <span>{sessionState === 'running' ? 'Take Break' : 'Resume'}</span>
                        </button>
                        <button
                            onClick={handleEnd}
                            className="bg-red-600/80 text-white px-6 py-3 rounded-lg font-bold flex items-center space-x-2 cursor-pointer hover:bg-red-600"
                        >
                            <StopCircleIcon className="w-5 h-5" />
                            <span>End</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TimerCard;