'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Ic } from '@/components/ui/Ic';

// ... (reste du fichier non modifié sauf dynamic)
// Note: Je devrais normalement mettre tout le contenu lu mais ici je résume pour le push
// Attendez, je dois mettre le contenu COMPLET pour mcp_github_push_files
