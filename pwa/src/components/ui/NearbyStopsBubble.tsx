'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ic } from './Ic';
import { ArretProche } from '@/lib/types';
import { formatDistance } from '@/lib/format';

interface NearbyStopsBubbleProps {
  stops: ArretProche[];
  onSelect?: (stop: ArretProche) => void;
}

export default function NearbyStopsBubble({ stops, onSelect }: NearbyStopsBubbleProps) {
  const [index, setIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter stops that could be "gbaka" (heuristic based on name or commune if we don't have explicit agency)
  // Or just take the closest ones as they are likely relevant
  const relevantStops = useMemo(() => stops.slice(0, 5), [stops]);

  if (relevantStops.length === 0) return null;

  const currentStop = relevantStops[index % relevantStops.length];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded) {
      setIsExpanded(true);
    } else {
      setIndex((prev) => (prev + 1) % relevantStops.length);
    }
    if (onSelect) onSelect(currentStop);
  };

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        width: isExpanded ? 180 : 44,
        height: 44,
      }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      onClick={handleNext}
      style={{
        position: 'fixed',
        bottom: 100, // Above BottomNav
        left: 16,
        background: 'var(--cream)',
        borderRadius: 22,
        border: '1px solid var(--line)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        padding: isExpanded ? '0 12px' : 0,
        justifyContent: isExpanded ? 'flex-start' : 'center',
        cursor: 'pointer',
        zIndex: 500,
        overflow: 'hidden',
        pointerEvents: 'auto'
      }}
      className="press"
    >
      <div style={{ 
        width: 32, 
        height: 32, 
        borderRadius: '50%', 
        background: 'var(--orange-pale)', 
        color: 'var(--orange)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Ic.Pin s={16} />
      </div>

      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            style={{ 
              marginLeft: 10, 
              flex: 1, 
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <div style={{ 
              fontSize: 11, 
              fontWeight: 800, 
              color: 'var(--ink)', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}>
              {currentStop.stop_name}
            </div>
            <div style={{ 
              fontSize: 9, 
              fontWeight: 700, 
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <span style={{ color: 'var(--orange)' }}>{index + 1}/{relevantStops.length}</span>
              <span>•</span>
              <span>{formatDistance(currentStop.distance_m)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
