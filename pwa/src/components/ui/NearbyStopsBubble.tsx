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

  const relevantStops = useMemo(() => stops.slice(0, 5), [stops]);

  if (relevantStops.length === 0) return null;

  const currentStop = relevantStops[index % relevantStops.length];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded) {
      setIsExpanded(true);
    } else {
      setIndex((prev) => (prev + 1) % relevantStops.length);
    }
    if (onSelect) onSelect(relevantStops[(index + (isExpanded ? 1 : 0)) % relevantStops.length]);
  };

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        width: isExpanded ? 200 : 44,
        height: 44,
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: 25, 
        left: 20,
        background: 'var(--cream)',
        borderRadius: 22,
        border: '1px solid var(--line)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        padding: isExpanded ? '0 12px' : 0,
        justifyContent: isExpanded ? 'flex-start' : 'center',
        cursor: 'pointer',
        zIndex: 1100,
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
        <Ic.Bus s={16} />
      </div>

      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ 
              marginLeft: 12, 
              flex: 1, 
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <div style={{ 
              fontSize: 12, 
              fontWeight: 800, 
              color: 'var(--ink)', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              lineHeight: 1.1
            }}>
              {currentStop.stop_name}
            </div>
            <div style={{ 
              fontSize: 10, 
              fontWeight: 700, 
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 1
            }}>
              <span style={{ color: 'var(--orange)', fontSize: 9 }}>{index % relevantStops.length + 1}/{relevantStops.length}</span>
              <span>•</span>
              <span>{formatDistance(currentStop.distance_m)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
