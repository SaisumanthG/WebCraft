import { useState, useMemo, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft, Search, FileText, Rocket, Users, Building2, UtensilsCrossed, Layers, Check, Star, Heart, GraduationCap, Home, Calendar, ShoppingBag, Palette, Plane, Dumbbell } from 'lucide-react';
import { templates, getTemplate, getTemplatesByCategory, type Template } from '@/lib/templates';
import { getThemesByCategory, applyThemeToComponents, Theme } from '@/lib/themes';
import { createSite, serializeComponents, serializePages } from '@/lib/siteStorage';
import { ThemePicker } from '@/components/editor/ThemePicker';
import { Navbar } from '@/components/layout/Navbar';

const categories = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'saas', label: 'SaaS / Tech', icon: Rocket },
  { id: 'portfolio', label: 'Portfolio', icon: Star },
  { id: 'business', label: 'Business', icon: Building2 },
  { id: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed },
  { id: 'wellness', label: 'Wellness & Spa', icon: Sparkles },
  { id: 'fitness', label: 'Fitness & Gym', icon: Dumbbell },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'health', label: 'Health & Clinic', icon: Heart },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'realestate', label: 'Real Estate', icon: Home },
  { id: 'event', label: 'Events', icon: Calendar },
  { id: 'fashion', label: 'Fashion', icon: ShoppingBag },
  { id: 'hotel', label: 'Hotel', icon: Building2 },
  { id: 'nonprofit', label: 'Nonprofit', icon: Heart },
  { id: 'agency', label: 'Creative Agency', icon: Palette },
  { id: 'techlanding', label: 'Tech Landing', icon: Rocket },
  { id: 'foodbev', label: 'Food & Beverage', icon: UtensilsCrossed },
];

type TemplateVisualProfile = {
  archetype: string;
  label: string;
  detail: string;
  seed: number;
  accent: string;
  accentTwo: string;
  bgA: string;
  bgB: string;
  surface: string;
  text: string;
};

const CATEGORY_HUES: Record<string, [number, number]> = {
  saas: [210, 62], portfolio: [270, 70], business: [205, 48], restaurant: [15, 38],
  wellness: [145, 46], fitness: [350, 38], travel: [185, 62], health: [170, 44],
  education: [220, 45], realestate: [30, 38], event: [295, 44], fashion: [325, 38],
  hotel: [195, 38], nonprofit: [135, 42], agency: [265, 58], techlanding: [200, 60], foodbev: [25, 50],
};

const CATEGORY_VISUALS: Record<string, Pick<TemplateVisualProfile, 'archetype' | 'label' | 'detail'>> = {
  saas: { archetype: 'dashboard', label: 'Software dashboard', detail: 'product UI, metrics, workflows' },
  portfolio: { archetype: 'portfolio', label: 'Creative portfolio', detail: 'case studies, selected work' },
  business: { archetype: 'business', label: 'Business services', detail: 'team, strategy, client trust' },
  restaurant: { archetype: 'restaurant', label: 'Dining experience', detail: 'signature dish and reservation flow' },
  wellness: { archetype: 'wellness', label: 'Wellness studio', detail: 'calm treatment and booking visual' },
  fitness: { archetype: 'fitness', label: 'Fitness training', detail: 'strength, progress, coaching' },
  travel: { archetype: 'travel', label: 'Travel destination', detail: 'itinerary, map, adventure' },
  health: { archetype: 'health', label: 'Healthcare clinic', detail: 'care team and patient portal' },
  education: { archetype: 'education', label: 'Learning platform', detail: 'lessons, progress, certificates' },
  realestate: { archetype: 'property', label: 'Property showcase', detail: 'homes, listings, neighborhood' },
  event: { archetype: 'events', label: 'Event landing', detail: 'stage, tickets, calendar' },
  fashion: { archetype: 'fashion', label: 'Fashion storefront', detail: 'collection, product cards, lookbook' },
  hotel: { archetype: 'hotel', label: 'Hotel booking', detail: 'suite, amenities, direct booking' },
  nonprofit: { archetype: 'nonprofit', label: 'Nonprofit impact', detail: 'mission, donors, community' },
  agency: { archetype: 'agency', label: 'Creative agency', detail: 'brand boards, campaign concepts' },
  techlanding: { archetype: 'launch', label: 'Product launch', detail: 'app screen, waitlist, release' },
  foodbev: { archetype: 'foodbev', label: 'Food brand', detail: 'product, packaging, ordering' },
};

const TEMPLATE_VISUAL_RULES: Array<{ pattern: RegExp; archetype: string; label: string; detail: string }> = [
  { pattern: /ai|gpt|writing tool|content generation|writeai/i, archetype: 'ai-writing', label: 'AI writing workspace', detail: 'prompt panel, generated copy, assistant chat' },
  { pattern: /crm|sales|pipeline|customer relationship/i, archetype: 'crm', label: 'CRM sales pipeline', detail: 'deals, contacts, follow-up automation' },
  { pattern: /analytics|data|report|insight|metrics/i, archetype: 'analytics', label: 'Analytics command center', detail: 'live charts, KPIs, insight cards' },
  { pattern: /video|stream|editor|motion/i, archetype: 'video', label: 'Video production suite', detail: 'player, timeline, chapters' },
  { pattern: /e-learning|learn|academy|course|education|student|school/i, archetype: 'education', label: 'Online learning hub', detail: 'courses, lessons, progress tracking' },
  { pattern: /hr|human resources|people|recruit|hiring|applicant/i, archetype: 'hr', label: 'People operations dashboard', detail: 'employees, onboarding, hiring pipeline' },
  { pattern: /marketing|email|campaign|growth|social/i, archetype: 'marketing', label: 'Marketing campaign planner', detail: 'calendar, segments, conversion stats' },
  { pattern: /invoice|billing|payment|finance|accounting/i, archetype: 'finance', label: 'Billing and payments screen', detail: 'invoice, totals, payment status' },
  { pattern: /support|ticket|help desk|chat/i, archetype: 'support', label: 'Customer support desk', detail: 'tickets, live chat, knowledge base' },
  { pattern: /e-commerce|shop|store|commerce|market|boutique/i, archetype: 'commerce', label: 'Commerce storefront', detail: 'product cards, checkout, inventory' },
  { pattern: /api|developer|code|dev/i, archetype: 'developer', label: 'Developer API console', detail: 'endpoints, docs, testing panel' },
  { pattern: /cyber|security|password|vault|lock|secure/i, archetype: 'security', label: 'Security control room', detail: 'shield, vault, threat monitoring' },
  { pattern: /survey|form|questionnaire/i, archetype: 'forms', label: 'Form builder', detail: 'questions, logic, responses' },
  { pattern: /project|workflow|automation|task|kanban/i, archetype: 'workflow', label: 'Workflow management board', detail: 'tasks, automations, project status' },
  { pattern: /cloud|storage|file|document|knowledge|wiki|base/i, archetype: 'knowledge', label: 'Knowledge and file hub', detail: 'docs, search, shared folders' },
  { pattern: /designer|design tool|ui\/ux|creative|agency|brand|studio|canvas|pixel/i, archetype: 'design', label: 'Design studio preview', detail: 'artboards, components, color swatches' },
  { pattern: /photograph|camera|photo/i, archetype: 'photography', label: 'Photography portfolio', detail: 'gallery wall, lens, hero image' },
  { pattern: /3d|render|architect|architecture/i, archetype: 'architecture', label: 'Spatial showcase', detail: 'model, blueprint, project gallery' },
  { pattern: /illustrator|illustration|artist|art/i, archetype: 'illustration', label: 'Illustration gallery', detail: 'sketches, color, portfolio pieces' },
  { pattern: /copywriter|writer|writing portfolio/i, archetype: 'copywriting', label: 'Writing portfolio', detail: 'editorial samples and campaign copy' },
  { pattern: /music|musician|audio/i, archetype: 'music', label: 'Music artist page', detail: 'album art, tracks, tour dates' },
  { pattern: /law|legal|attorney/i, archetype: 'legal', label: 'Legal services page', detail: 'practice areas, trust signals, consultation' },
  { pattern: /real estate|realty|home|property|estate|homes|nest/i, archetype: 'property', label: 'Real estate listings', detail: 'featured home, map, property cards' },
  { pattern: /restaurant|dining|burger|ramen|café|cafe|steak|italian/i, archetype: 'restaurant', label: 'Restaurant hero image', detail: 'dish, menu, reservation card' },
  { pattern: /spa|wellness|mindful|healing|zen|yoga|therapy|calm/i, archetype: 'wellness', label: 'Wellness appointment visual', detail: 'treatment, relaxation, booking CTA' },
  { pattern: /gym|fitness|train|athletic|cardio|muscle|workout|strength/i, archetype: 'fitness', label: 'Fitness program visual', detail: 'training plan, progress, coaching' },
  { pattern: /travel|tour|journey|adventure|island|mountain|safari|hotel|resort|lodge/i, archetype: 'travel', label: 'Destination travel scene', detail: 'landscape, route, booking panel' },
  { pattern: /clinic|health|medical|doctor|care|dental|med/i, archetype: 'health', label: 'Healthcare appointment visual', detail: 'patient care, doctor, portal card' },
  { pattern: /fashion|label|runway|style|luxe|vogue/i, archetype: 'fashion', label: 'Fashion collection preview', detail: 'lookbook, products, editorial layout' },
  { pattern: /hotel|suite|inn|palace|harbor|resort/i, archetype: 'hotel', label: 'Hospitality booking preview', detail: 'room card, amenities, rates' },
  { pattern: /foundation|nonprofit|charity|hope|green|earth|care|community/i, archetype: 'nonprofit', label: 'Mission impact visual', detail: 'donation, volunteers, progress goal' },
  { pattern: /brewery|bakery|juice|tea|coffee|chocolate|wine|smoothie|honey|spice|cream|food/i, archetype: 'foodbev', label: 'Food product preview', detail: 'packaging, ingredient, order card' },
  { pattern: /launch|startup|mvp|product|beta|app|rocket/i, archetype: 'launch', label: 'Product launch preview', detail: 'app screen, waitlist, growth graph' },
];

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function getTemplateVisualProfile(template: Template, globalIndex: number): TemplateVisualProfile {
  const seed = hashString(`${template.id}:${template.name}:${globalIndex}`);
  const source = `${template.name} ${template.description} ${template.category}`;
  const rule = TEMPLATE_VISUAL_RULES.find(r => r.pattern.test(source));
  const fallback = CATEGORY_VISUALS[template.category] || CATEGORY_VISUALS.saas;
  const hueRange = CATEGORY_HUES[template.category] || CATEGORY_HUES.saas;
  const hue = (hueRange[0] + (seed % hueRange[1])) % 360;
  const hueTwo = (hue + 38 + (seed % 46)) % 360;

  return {
    archetype: rule?.archetype || fallback.archetype,
    label: rule?.label || fallback.label,
    detail: rule?.detail || fallback.detail,
    seed,
    accent: `hsl(${hue} 84% 58%)`,
    accentTwo: `hsl(${hueTwo} 78% 62%)`,
    bgA: `hsl(${(hue + 220) % 360} 44% 10%)`,
    bgB: `hsl(${(hue + 250) % 360} 48% 17%)`,
    surface: `hsl(${(hue + 225) % 360} 36% 98% / 0.13)`,
    text: `hsl(${(hue + 12) % 360} 45% 94%)`,
  };
}

function SceneArtwork({ profile, template }: { profile: TemplateVisualProfile; template: Template }) {
  const gid = `preview-${template.id.replace(/[^a-z0-9]/gi, '-')}-${profile.seed}`;
  const common = { stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const title = template.name.length > 18 ? `${template.name.slice(0, 18)}…` : template.name;

  const renderScene = () => {
    switch (profile.archetype) {
      case 'ai-writing':
        return <><rect x="24" y="33" width="128" height="82" rx="12" fill={`url(#${gid}-glass)`} /><rect x="38" y="47" width="31" height="31" rx="7" fill={profile.accent} /><text x="47" y="68" fontSize="17" fontWeight="800" fill="white">AI</text><path d="M82 53h47M82 66h55M38 91h92M38 102h75" {...common} opacity=".72" /><path d="M83 83c7-14 11 14 18 0s11 14 18 0 11 14 18 0" {...common} stroke={profile.accentTwo} /><rect x="142" y="43" width="46" height="12" rx="6" fill={profile.accentTwo} opacity=".78" /><rect x="154" y="64" width="54" height="14" rx="7" fill="currentColor" opacity=".18" /><rect x="146" y="84" width="39" height="13" rx="7" fill="currentColor" opacity=".22" /><path d="M50 126h112l18 11H34z" fill="currentColor" opacity=".16" /></>;
      case 'crm':
        return <><rect x="25" y="32" width="167" height="93" rx="13" fill={`url(#${gid}-glass)`} /><circle cx="48" cy="55" r="10" fill={profile.accent} /><path d="M66 50h45M66 61h28" {...common} opacity=".65" />{[0, 1, 2].map(i => <g key={i}><rect x={38 + i * 49} y="80" width="37" height="28" rx="7" fill={i === 1 ? profile.accentTwo : 'currentColor'} opacity={i === 1 ? .75 : .18} /><path d={`M45 ${91 + i * 2}h20M45 ${100 + i * 2}h13`} {...common} stroke={i === 1 ? 'white' : 'currentColor'} opacity=".72" /></g>)}<path d="M70 129c22-10 53-10 80 0" {...common} stroke={profile.accent} /></>;
      case 'analytics':
      case 'dashboard':
      case 'data':
        return <><rect x="22" y="31" width="176" height="96" rx="14" fill={`url(#${gid}-glass)`} /><path d="M42 98l25-25 24 16 35-39 39 27" {...common} stroke={profile.accentTwo} /><circle cx="67" cy="73" r="5" fill={profile.accentTwo} /><circle cx="126" cy="50" r="5" fill={profile.accentTwo} />{[0, 1, 2, 3].map(i => <rect key={i} x={43 + i * 33} y={105 - i * 11} width="16" height={20 + i * 11} rx="5" fill={i % 2 ? profile.accent : 'currentColor'} opacity={i % 2 ? .82 : .22} />)}<rect x="150" y="45" width="29" height="18" rx="7" fill={profile.accent} opacity=".8" /></>;
      case 'video':
        return <><rect x="25" y="33" width="170" height="92" rx="14" fill={`url(#${gid}-glass)`} /><path d="M99 61l31 18-31 18z" fill={profile.accent} /><rect x="43" y="105" width="115" height="7" rx="4" fill="currentColor" opacity=".2" /><rect x="43" y="105" width="64" height="7" rx="4" fill={profile.accentTwo} /><rect x="163" y="104" width="15" height="9" rx="4" fill="currentColor" opacity=".28" /><path d="M50 47h32M138 47h34" {...common} opacity=".55" /></>;
      case 'education':
        return <><path d="M38 52h63c11 0 18 7 18 18v58H56c-10 0-18-8-18-18z" fill={`url(#${gid}-glass)`} /><path d="M119 70c0-11 7-18 18-18h45v75h-63z" fill="currentColor" opacity=".14" /><path d="M62 74h36M62 90h43M140 74h24M140 90h29" {...common} opacity=".65" /><path d="M98 39l43-16 43 16-43 16zM118 51v18c13 8 31 8 45 0V51" {...common} stroke={profile.accentTwo} /><circle cx="184" cy="76" r="7" fill={profile.accent} /></>;
      case 'hr':
      case 'recruiting':
        return <><rect x="32" y="35" width="154" height="94" rx="15" fill={`url(#${gid}-glass)`} />{[[72, 62], [118, 62], [164, 62], [95, 101], [142, 101]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="12" fill={i === 1 ? profile.accent : 'currentColor'} opacity={i === 1 ? .9 : .22} /><path d={`M${x - 16} ${y + 24}c7-10 25-10 32 0`} {...common} stroke={i === 1 ? profile.accentTwo : 'currentColor'} opacity=".7" /></g>)}<path d="M118 75v14M95 89h47" {...common} opacity=".42" /></>;
      case 'marketing':
      case 'social':
        return <><rect x="33" y="46" width="76" height="62" rx="13" fill={`url(#${gid}-glass)`} /><path d="M113 61l54-22v72l-54-22z" fill={profile.accent} opacity=".9" /><path d="M167 57c17 9 17 35 0 44" {...common} stroke={profile.accentTwo} /><path d="M51 65h38M51 80h31M51 95h44" {...common} opacity=".65" /><circle cx="183" cy="72" r="9" fill="currentColor" opacity=".18" /><circle cx="190" cy="101" r="6" fill={profile.accentTwo} /></>;
      case 'finance':
        return <><rect x="62" y="31" width="96" height="106" rx="12" fill={`url(#${gid}-glass)`} /><path d="M84 57h51M84 74h38M84 91h51" {...common} opacity=".62" /><rect x="84" y="108" width="53" height="15" rx="7" fill={profile.accent} /><circle cx="56" cy="65" r="20" fill="currentColor" opacity=".14" /><text x="47" y="73" fontSize="24" fontWeight="800" fill={profile.accentTwo}>$</text><path d="M156 47h25M156 61h18" {...common} stroke={profile.accentTwo} /></>;
      case 'support':
      case 'chat':
        return <><rect x="31" y="42" width="83" height="48" rx="15" fill={`url(#${gid}-glass)`} /><rect x="103" y="76" width="81" height="45" rx="15" fill="currentColor" opacity=".16" /><path d="M51 63h42M51 76h27M124 96h39M124 108h24" {...common} opacity=".66" /><path d="M62 105c0-30 31-49 59-35" {...common} stroke={profile.accentTwo} /><circle cx="58" cy="105" r="12" fill={profile.accent} /><circle cx="140" cy="61" r="9" fill={profile.accentTwo} /></>;
      case 'commerce':
      case 'fashion':
        return <><rect x="30" y="47" width="48" height="67" rx="12" fill={`url(#${gid}-glass)`} /><rect x="89" y="34" width="48" height="80" rx="12" fill="currentColor" opacity=".16" /><rect x="148" y="55" width="42" height="59" rx="12" fill={`url(#${gid}-glass)`} /><path d="M44 84h20M103 74h21M103 91h14M160 88h18" {...common} opacity=".65" /><path d="M48 47c2-18 28-18 30 0M101 34c2-18 28-18 30 0M158 55c2-15 24-15 26 0" {...common} stroke={profile.accentTwo} /><circle cx="127" cy="123" r="8" fill={profile.accent} /><path d="M74 123h53" {...common} stroke={profile.accent} /></>;
      case 'developer':
        return <><rect x="24" y="35" width="172" height="90" rx="13" fill={`url(#${gid}-glass)`} /><text x="44" y="77" fontSize="31" fontWeight="800" fill={profile.accent}>{'{'}</text><text x="162" y="77" fontSize="31" fontWeight="800" fill={profile.accentTwo}>{'}'}</text><path d="M80 56h58M80 73h41M80 90h66M80 107h32" {...common} opacity=".66" /><rect x="39" y="96" width="29" height="14" rx="7" fill="currentColor" opacity=".2" /><path d="M123 51l-22 63" {...common} stroke={profile.accentTwo} /></>;
      case 'security':
        return <><path d="M110 27l63 22v37c0 34-25 51-63 62-38-11-63-28-63-62V49z" fill={`url(#${gid}-glass)`} /><path d="M110 55c20 0 35 15 35 35s-15 35-35 35-35-15-35-35 15-35 35-35z" fill="currentColor" opacity=".12" /><rect x="88" y="88" width="44" height="31" rx="8" fill={profile.accent} /><path d="M96 88V77c0-19 28-19 28 0v11" {...common} stroke={profile.accentTwo} /><path d="M55 128h28M139 128h31" {...common} opacity=".56" /></>;
      case 'forms':
        return <><rect x="53" y="31" width="114" height="104" rx="13" fill={`url(#${gid}-glass)`} />{[0, 1, 2].map(i => <g key={i}><circle cx="76" cy={62 + i * 24} r="7" fill={i === 1 ? profile.accent : 'currentColor'} opacity={i === 1 ? .88 : .22} /><path d={`M92 ${62 + i * 24}h49`} {...common} opacity=".62" /></g>)}<rect x="88" y="116" width="54" height="12" rx="6" fill={profile.accentTwo} /><path d="M169 57h18M169 75h24M169 93h14" {...common} stroke={profile.accent} /></>;
      case 'workflow':
        return <><rect x="29" y="39" width="46" height="79" rx="11" fill={`url(#${gid}-glass)`} /><rect x="87" y="31" width="46" height="96" rx="11" fill="currentColor" opacity=".16" /><rect x="145" y="50" width="46" height="68" rx="11" fill={`url(#${gid}-glass)`} />{[48, 67, 86, 105].map((y, i) => <path key={i} d={`M43 ${y}h18`} {...common} stroke={i === 1 ? profile.accent : 'currentColor'} opacity=".64" />)}<path d="M75 74h12M133 74h12" {...common} stroke={profile.accentTwo} /><circle cx="110" cy="80" r="16" fill={profile.accent} opacity=".85" /></>;
      case 'knowledge':
        return <><rect x="33" y="43" width="154" height="84" rx="14" fill={`url(#${gid}-glass)`} /><path d="M55 66h73M55 82h98M55 98h48" {...common} opacity=".64" /><rect x="137" y="60" width="28" height="42" rx="6" fill={profile.accent} opacity=".84" /><path d="M143 71h16M143 83h12" {...common} stroke="white" opacity=".75" /><circle cx="65" cy="122" r="10" fill={profile.accentTwo} /><path d="M80 122h60" {...common} stroke={profile.accentTwo} /></>;
      case 'design':
      case 'agency':
      case 'portfolio':
      case 'illustration':
        return <><rect x="32" y="36" width="78" height="86" rx="13" fill={`url(#${gid}-glass)`} /><rect x="122" y="47" width="65" height="44" rx="12" fill="currentColor" opacity=".16" /><circle cx="63" cy="72" r="20" fill={profile.accent} opacity=".82" /><path d="M47 105h47M132 64h38M132 79h25" {...common} opacity=".66" /><circle cx="135" cy="111" r="9" fill={profile.accent} /><circle cx="158" cy="111" r="9" fill={profile.accentTwo} /><circle cx="181" cy="111" r="9" fill="currentColor" opacity=".22" /></>;
      case 'photography':
        return <><rect x="34" y="48" width="151" height="82" rx="14" fill={`url(#${gid}-glass)`} /><circle cx="110" cy="89" r="27" fill="currentColor" opacity=".16" /><circle cx="110" cy="89" r="17" fill={profile.accent} opacity=".86" /><path d="M57 48l14-18h34l10 18M50 112l35-31 25 23 20-19 38 27" {...common} stroke={profile.accentTwo} /><circle cx="165" cy="66" r="7" fill="currentColor" opacity=".25" /></>;
      case 'architecture':
      case 'property':
      case 'hotel':
      case 'business':
        return <><path d="M40 120V68l69-35 69 35v52" fill={`url(#${gid}-glass)`} /><path d="M69 120V81h81v39M91 120V93h36v27" {...common} /><path d="M109 33l76 39M109 33L33 72" {...common} stroke={profile.accentTwo} /><rect x="142" y="91" width="24" height="29" rx="4" fill={profile.accent} opacity=".82" /><rect x="55" y="90" width="23" height="20" rx="4" fill="currentColor" opacity=".2" /></>;
      case 'copywriting':
        return <><rect x="45" y="30" width="128" height="104" rx="13" fill={`url(#${gid}-glass)`} /><path d="M69 59h77M69 76h58M69 93h78M69 110h42" {...common} opacity=".64" /><path d="M145 103l27 27M151 96l28 28" {...common} stroke={profile.accentTwo} /><circle cx="70" cy="39" r="6" fill={profile.accent} /><rect x="58" y="121" width="55" height="10" rx="5" fill={profile.accent} /></>;
      case 'music':
        return <><circle cx="83" cy="85" r="46" fill={`url(#${gid}-glass)`} /><circle cx="83" cy="85" r="16" fill={profile.accent} /><path d="M140 41v62c0 13-11 23-24 19-13-4-12-21 2-25 8-2 15 0 22 5V55l42-11v47" {...common} stroke={profile.accentTwo} /><path d="M55 137h74" {...common} opacity=".54" /></>;
      case 'legal':
        return <><path d="M110 36v89M65 60h90M75 60l-27 45h54zM145 60l-27 45h54z" {...common} /><rect x="73" y="125" width="74" height="12" rx="6" fill={profile.accent} /><circle cx="110" cy="48" r="13" fill={profile.accentTwo} opacity=".82" /><rect x="45" y="35" width="130" height="95" rx="13" fill={`url(#${gid}-glass)`} opacity=".45" /></>;
      case 'restaurant':
      case 'foodbev':
        return <><circle cx="92" cy="83" r="45" fill={`url(#${gid}-glass)`} /><circle cx="92" cy="83" r="26" fill="currentColor" opacity=".14" /><path d="M66 82c18-20 40 20 56 0" {...common} stroke={profile.accentTwo} /><path d="M151 44v84M165 44v84M151 76h14M181 46c-10 19-9 37 0 49v33" {...common} stroke={profile.accent} /><rect x="51" y="123" width="85" height="11" rx="5" fill="currentColor" opacity=".18" /></>;
      case 'wellness':
        return <><path d="M110 123c-35-7-55-29-57-67 31 5 50 25 57 67zM110 123c35-7 55-29 57-67-31 5-50 25-57 67zM110 120c-21-27-21-54 0-80 21 26 21 53 0 80z" fill={`url(#${gid}-glass)`} /><path d="M63 131h94" {...common} stroke={profile.accentTwo} /><circle cx="171" cy="46" r="13" fill={profile.accent} opacity=".78" /><path d="M49 48c8-8 16-8 24 0M152 104c8-8 16-8 24 0" {...common} opacity=".55" /></>;
      case 'fitness':
        return <><path d="M43 83h134M53 61v44M73 54v58M147 54v58M167 61v44" {...common} stroke={profile.accentTwo} /><rect x="82" y="61" width="56" height="44" rx="12" fill={`url(#${gid}-glass)`} /><path d="M95 88l12-17 12 26 12-19" {...common} stroke={profile.accent} /><circle cx="58" cy="126" r="10" fill={profile.accent} /><path d="M77 126h66" {...common} opacity=".54" /></>;
      case 'travel':
        return <><path d="M27 123l43-55 32 39 28-30 63 46z" fill={`url(#${gid}-glass)`} /><circle cx="163" cy="51" r="18" fill={profile.accent} opacity=".82" /><path d="M53 53c37-20 84-16 122 12" {...common} stroke={profile.accentTwo} strokeDasharray="6 8" /><path d="M108 47l20 8-18 10 5-10z" fill={profile.accentTwo} /><rect x="46" y="112" width="102" height="17" rx="8" fill="currentColor" opacity=".16" /></>;
      case 'health':
        return <><rect x="43" y="42" width="134" height="84" rx="17" fill={`url(#${gid}-glass)`} /><path d="M110 59v49M86 84h49" {...common} stroke={profile.accent} strokeWidth={8} /><path d="M53 133c20-16 48-17 70-2 16 11 34 10 51-1" {...common} stroke={profile.accentTwo} /><circle cx="166" cy="54" r="11" fill={profile.accentTwo} opacity=".76" /></>;
      case 'events':
      case 'launch':
        return <><rect x="42" y="42" width="136" height="84" rx="15" fill={`url(#${gid}-glass)`} /><path d="M42 67h136" {...common} opacity=".5" /><rect x="66" y="83" width="29" height="29" rx="7" fill={profile.accent} /><rect x="105" y="83" width="29" height="29" rx="7" fill="currentColor" opacity=".18" /><path d="M124 34v25M96 34v25M152 34v25" {...common} stroke={profile.accentTwo} /><path d="M59 128l103-103" {...common} stroke={profile.accentTwo} strokeDasharray="7 8" /></>;
      case 'nonprofit':
        return <><path d="M110 122C69 99 48 79 55 57c6-18 30-18 43-1 13-17 37-17 43 1 8 22-13 42-31 65z" fill={`url(#${gid}-glass)`} /><path d="M50 128c26-17 47-17 63 0M110 128c20-15 42-15 66 0" {...common} stroke={profile.accentTwo} /><circle cx="166" cy="54" r="14" fill={profile.accent} opacity=".78" /><path d="M70 71c9-8 18-8 27 0" {...common} opacity=".55" /></>;
      default:
        return <><rect x="29" y="37" width="162" height="90" rx="15" fill={`url(#${gid}-glass)`} /><path d="M51 64h74M51 82h103M51 100h62" {...common} opacity=".65" /><circle cx="151" cy="70" r="22" fill={profile.accent} opacity=".82" /><path d="M137 103h34" {...common} stroke={profile.accentTwo} /></>;
    }
  };

  return (
    <svg viewBox="0 0 220 150" className="template-scene" aria-hidden="true" style={{ color: profile.text }}>
      <defs>
        <linearGradient id={`${gid}-glass`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.24" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      {renderScene()}
      <text x="18" y="143" fontSize="11" fontWeight="700" fill="currentColor" opacity=".56">{title}</text>
    </svg>
  );
}

function TemplateMiniPreview({ template, index }: { template: Template; index: number }) {
  const profile = getTemplateVisualProfile(template, index);
  const style = {
    '--preview-bg-a': profile.bgA,
    '--preview-bg-b': profile.bgB,
    '--preview-accent': profile.accent,
    '--preview-accent-two': profile.accentTwo,
    '--preview-surface': profile.surface,
    '--preview-text': profile.text,
  } as CSSProperties;

  return (
    <div className="template-preview-card" style={style} role="img" aria-label={`${template.name}: ${profile.label}`}>
      <div className="template-preview-grid" />
      <div className="template-preview-glow template-preview-glow-a" />
      <div className="template-preview-glow template-preview-glow-b" />
      <div className="template-preview-copy">
        <span>{template.category}</span>
        <strong>{profile.label}</strong>
        <small>{profile.detail}</small>
      </div>
      <SceneArtwork profile={profile} template={template} />
    </div>
  );
}

export default function NewSite() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [title, setTitle] = useState('');

  const filteredTemplates = useMemo(() => {
    let list = getTemplatesByCategory(activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    return list;
  }, [activeCategory, search]);

  const handleSelectTemplate = (t: Template) => {
    if (t.id === 'blank') {
      const site = createSite({ title: 'Untitled Site', category: 'saas', components_json: '[]', global_styles_json: '{}' });
      navigate(`/editor?id=${site.id}`);
      return;
    }
    setSelectedTemplate(t);
    setStep(2);
  };

  const handleDoubleClickCreate = (t: Template) => {
    if (t.id === 'blank') { handleSelectTemplate(t); return; }
    const { components, category, pages } = getTemplate(t.id);
    const site = createSite({
      title: t.name + ' Site',
      category,
      components_json: serializeComponents(components),
      pages_json: serializePages(pages),
      global_styles_json: '{}',
    });
    navigate(`/editor?id=${site.id}`);
  };

  const handleCreate = () => {
    if (!selectedTemplate) return;
    const { components, category, pages } = getTemplate(selectedTemplate.id);
    const themed = selectedTheme ? applyThemeToComponents(components, selectedTheme) : components;
    const themedPages = selectedTheme ? pages.map(p => ({ ...p, components: applyThemeToComponents(p.components, selectedTheme) })) : pages;
    const site = createSite({
      title: title || selectedTemplate.name + ' Site',
      category,
      components_json: serializeComponents(themed),
      pages_json: serializePages(themedPages),
      global_styles_json: selectedTheme ? JSON.stringify(selectedTheme) : '{}',
    });
    navigate(`/editor?id=${site.id}`);
  };

  const totalCount = getTemplatesByCategory('all').length;

  return (
    <div className="min-h-screen bg-landing-bg">
      <Navbar />

      <div className="border-b border-landing-border bg-landing-surface/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => step > 1 ? setStep((step - 1) as 1 | 2) : navigate('/')} className="rounded-lg p-1.5 text-landing-text transition-colors hover:bg-landing-border hover:text-landing-bright">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold text-landing-bright">Create New Site</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {['Template', 'Customize'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <span className="text-landing-text/40">→</span>}
                <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${step > i ? 'bg-primary/15 text-primary font-medium' : 'text-landing-text'}`}>
                  {step > i + 1 && <Check className="h-3 w-3" />}
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-7xl px-6 py-8">
            <div className="mb-6">
              <h1 className="mb-1 text-2xl font-bold text-landing-bright">Choose a Template</h1>
              <p className="text-sm text-landing-text">{totalCount} professionally designed templates across {categories.length - 1} categories.</p>
            </div>

            {/* Category tabs + search */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {categories.map(cat => {
                const Icon = cat.icon;
                const count = cat.id === 'all' ? totalCount : getTemplatesByCategory(cat.id).length;
                return (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${activeCategory === cat.id ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-landing-surface text-landing-text hover:bg-landing-border hover:text-landing-bright border border-landing-border'}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {cat.label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeCategory === cat.id ? 'bg-primary-foreground/20' : 'bg-landing-border'}`}>{count}</span>
                  </button>
                );
              })}
              <div className="ml-auto flex items-center gap-2 rounded-lg border border-landing-border bg-landing-surface px-3 py-1.5">
                <Search className="h-4 w-4 text-landing-text/50" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
                  className="w-48 bg-transparent text-sm text-landing-bright placeholder:text-landing-text/40 focus:outline-none" />
              </div>
            </div>

            {/* Blank canvas option */}
            <motion.button onClick={() => handleSelectTemplate(templates[0])} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex w-full items-center gap-4 rounded-xl border-2 border-dashed border-landing-border bg-landing-surface/50 p-4 text-left transition-all hover:border-primary/50 hover:bg-landing-surface">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-landing-border">
                <FileText className="h-6 w-6 text-landing-text" />
              </div>
              <div>
                <h3 className="font-semibold text-landing-bright">Blank Canvas</h3>
                <p className="text-xs text-landing-text">Start from scratch — drag and drop components to build your own layout</p>
              </div>
            </motion.button>

            {/* Template grid */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredTemplates.map((t, i) => (
                <motion.button key={t.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.4) }}
                  onClick={() => handleSelectTemplate(t)}
                  onDoubleClick={() => handleDoubleClickCreate(t)}
                  className="group overflow-hidden rounded-xl border border-landing-border bg-landing-surface text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                  <div className="aspect-[4/3] overflow-hidden">
                    <TemplateMiniPreview template={t} index={i} />
                  </div>
                  <div className="border-t border-landing-border p-3">
                    <h3 className="mb-0.5 text-sm font-semibold text-landing-bright group-hover:text-primary transition-colors">{t.name}</h3>
                    <p className="text-xs text-landing-text line-clamp-1">{t.description}</p>
                    <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{t.category}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="py-20 text-center text-landing-text">No templates match your search.</div>
            )}
          </motion.div>
        )}

        {step === 2 && selectedTemplate && (
          <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-6xl px-6 py-8">
            <div className="mb-6">
              <h1 className="mb-1 text-2xl font-bold text-landing-bright">Customize: {selectedTemplate.name}</h1>
              <p className="text-sm text-landing-text">Choose a theme and name your site. Everything can be edited later.</p>
            </div>

            <div className="mb-6">
              <input type="text" placeholder="Site title (optional)" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full max-w-sm rounded-lg border border-landing-border bg-landing-surface px-4 py-2.5 text-landing-bright placeholder:text-landing-text/50 focus:border-primary focus:outline-none" />
            </div>

            <button onClick={() => setSelectedTheme(null)}
              className={`mb-4 flex items-center gap-3 rounded-lg border px-4 py-3 transition-all ${!selectedTheme ? 'border-primary bg-primary/10' : 'border-landing-border bg-landing-surface hover:border-landing-text/30'}`}>
              {!selectedTheme && <Check className="h-4 w-4 text-primary" />}
              <span className="text-sm font-medium text-landing-bright">Default theme (template colors)</span>
            </button>

            <ThemePicker category={selectedTemplate.category} selected={selectedTheme} onSelect={setSelectedTheme} columns={5} />

            {selectedTheme && (
              <div className="mt-6 flex items-center gap-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                <div className="flex gap-1.5">
                  {[selectedTheme.primary, selectedTheme.bg, selectedTheme.surface, selectedTheme.text, selectedTheme.secondary].map((c, i) => (
                    <div key={i} className="h-5 w-5 rounded-full border border-landing-border" style={{ background: c }} />
                  ))}
                </div>
                <span className="text-sm font-medium text-landing-bright">{selectedTheme.name}</span>
              </div>
            )}

            <div className="mt-8">
              <button onClick={handleCreate} className="rounded-xl bg-primary px-8 py-3 font-semibold text-primary-foreground transition-all hover:opacity-90 shadow-lg shadow-primary/20">
                Create Website →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}