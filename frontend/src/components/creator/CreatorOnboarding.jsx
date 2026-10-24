import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function CreatorOnboarding({
  currentUser,
  onComplete,
  onLogout,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Step 2: Identity & Bio
  const [displayName, setDisplayName] = useState(currentUser?.full_name || '');
  const [handle, setHandle] = useState(() => {
    const raw = currentUser?.email ? currentUser.email.split('@')[0] : 'creator';
    return raw.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'creator';
  });
  const [primarySpecialization, setPrimarySpecialization] = useState('Generative Video & Concept Art');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('/assets/creator-portraits/elena.jpg');
  const [location, setLocation] = useState('Bengaluru, Karnataka');
  const [yearsExperience, setYearsExperience] = useState(2);
  const [minBudget, setMinBudget] = useState(25000);
  const [hourlyRate, setHourlyRate] = useState(2500);

  // Step 3: Taxonomy
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);
  const [selectedTools, setSelectedTools] = useState([]);

  // Step 4: Portfolio Projects
  const [projects, setProjects] = useState([]);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    content_type: 'VIDEO',
    aspect_ratio: '16:9',
    primary_asset_url: '/assets/campaign-covers/brand_skincare_cover.jpg',
    thumbnail_url: '/assets/campaign-covers/brand_skincare_cover.jpg',
    evidence_title: '',
    evidence_file_url: '',
    evidence_type: 'PROJECT_FILE',
  });

  const [_isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  // Load existing profile & taxonomies
  useEffect(() => {
    let isMounted = true;
    async function initData() {
      setIsLoading(true);
      try {
        const [profData, catsData, skillsData, toolsData] = await Promise.all([
          api.getMyCreatorProfile().catch(() => null),
          api.getCategories().catch(() => []),
          api.getSkills().catch(() => []),
          api.getTools().catch(() => []),
        ]);

        if (!isMounted) return;

        if (catsData && Array.isArray(catsData)) setAvailableCategories(catsData);
        if (skillsData && Array.isArray(skillsData)) setAvailableSkills(skillsData);
        if (toolsData && Array.isArray(toolsData)) setAvailableTools(toolsData);

        if (profData) {
          if (profData.display_name) setDisplayName(profData.display_name);
          if (profData.handle) setHandle(profData.handle);
          if (profData.primary_specialization) setPrimarySpecialization(profData.primary_specialization);
          if (profData.bio) setBio(profData.bio);
          if (profData.avatar_url) setAvatarUrl(profData.avatar_url);
          if (profData.location) setLocation(profData.location);
          if (profData.years_experience) setYearsExperience(profData.years_experience);
          if (profData.min_budget) setMinBudget(profData.min_budget);
          if (profData.hourly_rate) setHourlyRate(profData.hourly_rate);

          if (profData.categories && Array.isArray(profData.categories)) {
            setSelectedCategories(profData.categories.map((c) => c.category_id || c.id || c.name));
          }
          if (profData.skills && Array.isArray(profData.skills)) {
            setSelectedSkills(profData.skills.map((s) => s.skill_id || s.id));
          }
          if (profData.tools && Array.isArray(profData.tools)) {
            setSelectedTools(profData.tools.map((t) => t.tool_id || t.id));
          }
          if (profData.portfolio_projects && Array.isArray(profData.portfolio_projects)) {
            setProjects(profData.portfolio_projects);
          }
        }
      } catch (err) {
        console.error('Failed to initialize onboarding data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    initData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveProfile = async (silent = false) => {
    if (!silent) setIsSaving(true);
    setError(null);
    try {
      const payload = {
        display_name: displayName.trim() || currentUser?.full_name || 'Creator',
        handle: handle.trim().toLowerCase(),
        primary_specialization: primarySpecialization,
        bio: bio.trim() || 'Generative AI Creator specializing in high-fidelity commercial synthesis.',
        avatar_url: avatarUrl,
        location: location.trim() || 'Remote',
        years_experience: Number(yearsExperience) || 1,
        min_budget: Number(minBudget) || 100,
        hourly_rate: Number(hourlyRate) || 50,
        category_ids: selectedCategories,
        skill_ids: selectedSkills,
        tool_ids: selectedTools,
      };

      await api.setupOrUpdateCreatorProfile(payload);
      if (!silent) {
        setSaveSuccessMsg('Profile information saved successfully.');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
      return true;
    } catch (err) {
      setError(err.message || 'Failed to save creator profile.');
      return false;
    } finally {
      if (!silent) setIsSaving(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.title.trim()) {
      setError('Please provide a project title.');
      return;
    }
    if (!newProject.description.trim()) {
      setError('Please provide a project description.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // 1. Ensure profile is saved first
      await handleSaveProfile(true);

      // 2. Create project
      const projPayload = {
        title: newProject.title.trim(),
        description: newProject.description.trim(),
        content_type: newProject.content_type,
        aspect_ratio: newProject.aspect_ratio,
        primary_asset_url: newProject.primary_asset_url || '/assets/campaign-covers/brand_skincare_cover.jpg',
        thumbnail_url: newProject.thumbnail_url || '/assets/campaign-covers/brand_skincare_cover.jpg',
        resolution: '4K UHD',
        commercial_rights_held: true,
        commercial_license_type: 'Full Commercial Buyout',
        featured: projects.length === 0,
      };

      const createdProj = await api.addPortfolioProject(projPayload);

      // 3. Optional evidence upload
      if (newProject.evidence_title.trim() && newProject.evidence_file_url.trim()) {
        try {
          await api.addProjectEvidence(createdProj.id, {
            title: newProject.evidence_title.trim(),
            file_url: newProject.evidence_file_url.trim(),
            evidence_type: newProject.evidence_type,
            description: 'Supporting process evidence provided during creator onboarding.',
            notes: 'Supporting process evidence provided during creator onboarding.',
          });
        } catch (evErr) {
          console.warn('Evidence attachment notice:', evErr);
        }
      }

      setProjects((prev) => [...prev, createdProj]);
      setIsAddingProject(false);
      setNewProject({
        title: '',
        description: '',
        content_type: 'VIDEO',
        aspect_ratio: '16:9',
        primary_asset_url: '/assets/campaign-covers/brand_skincare_cover.jpg',
        thumbnail_url: '/assets/campaign-covers/brand_skincare_cover.jpg',
        evidence_title: '',
        evidence_file_url: '',
        evidence_type: 'PROJECT_FILE',
      });
      setSaveSuccessMsg('Portfolio project added!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add portfolio project.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (projId) => {
    if (!window.confirm('Are you sure you want to remove this project?')) return;
    try {
      await api.deletePortfolioProject(projId);
      setProjects((prev) => prev.filter((p) => p.id !== projId));
    } catch (err) {
      alert('Failed to delete project: ' + err.message);
    }
  };

  const handleFinalSubmit = async () => {
    // Validations
    if (!displayName.trim()) {
      setError('Display name is required.');
      setCurrentStep(2);
      return;
    }
    if (!bio.trim() || bio.trim().length < 15) {
      setError('Please provide a professional bio of at least 15 characters.');
      setCurrentStep(2);
      return;
    }
    if (projects.length === 0) {
      setError('At least one portfolio project is required before submission.');
      setCurrentStep(4);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // 1. Sync profile
      await handleSaveProfile(true);

      // 2. Submit for review
      const res = await api.submitCreatorForReview();
      if (onComplete) {
        onComplete(res);
      }
    } catch (err) {
      const status = err.status || (err.response && err.response.status);
      const detail = err.detail || err.message || '';
      if (status === 503 || detail.includes('approval_status') || detail.includes('migration')) {
        setError('Database Schema Migration Required (HTTP 503): Creator approval submission requires schema migration. Contact administrator to apply pending Alembic migration 8f2c3b4a5d6e.');
      } else if (status === 401 || status === 403) {
        setError('Access Denied: Please sign in with a verified creator account to submit your portfolio.');
      } else {
        setError(detail || 'Submission failed. Please check required fields.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = async () => {
    setError(null);
    if (currentStep === 2) {
      if (!displayName.trim()) {
        setError('Display name is required.');
        return;
      }
      if (!bio.trim() || bio.trim().length < 15) {
        setError('Please enter a bio with at least 15 characters to introduce yourself to brands.');
        return;
      }
      await handleSaveProfile(true);
    } else if (currentStep === 3) {
      await handleSaveProfile(true);
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>✦</span>
              <span style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.08em', color: '#7952EC', textTransform: 'uppercase' }}>
                Kivora Creator Studio
              </span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1E0B38', margin: '4px 0 0', letterSpacing: '-0.02em' }}>
              Creator Portfolio Onboarding
            </h1>
          </div>
          <button
            type="button"
            onClick={onLogout}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(0,0,0,0.08)',
              backgroundColor: '#FFFFFF',
              color: '#6B7280',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>

        {/* Progress Tracker Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            border: '1px solid rgba(121, 82, 236, 0.12)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#7952EC' }}>
              Step {currentStep} of {totalSteps}
            </span>
            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>
              {currentStep === 1 && 'Welcome & Introduction'}
              {currentStep === 2 && 'Identity & Professional Bio'}
              {currentStep === 3 && 'Category, Skills & Tools'}
              {currentStep === 4 && 'Portfolio Projects & Evidence'}
              {currentStep === 5 && 'Preview & Submit for Review'}
            </span>
          </div>

          <div style={{ width: '100%', height: '6px', backgroundColor: '#EDE9FE', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(currentStep / totalSteps) * 100}%`,
                height: '100%',
                backgroundColor: '#7952EC',
                borderRadius: '999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Notifications / Alerts */}
        {error && (
          <div
            style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '1.5rem',
            }}
          >
            {error}
          </div>
        )}

        {saveSuccessMsg && (
          <div
            style={{
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '1.5rem',
            }}
          >
            {saveSuccessMsg}
          </div>
        )}

        {/* Main Content Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)',
            padding: '2rem',
          }}
        >
          {/* STEP 1: WELCOME */}
          {currentStep === 1 && (
            <div>
              <div style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto', padding: '1rem 0 2rem' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    backgroundColor: '#EDE9FE',
                    color: '#6D28D9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    margin: '0 auto 1.25rem',
                  }}
                >
                  ✨
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1E0B38', marginBottom: '8px' }}>
                  Welcome to Kivora, {displayName || 'Creator'}!
                </h2>
                <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6', margin: '0 0 1.5rem' }}>
                  Kivora connects verified generative AI creators with leading global brands. Before accessing campaign briefs, collaborations, and client pitches, let&apos;s build your audited portfolio showcase.
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    textAlign: 'left',
                    marginTop: '2rem',
                  }}
                >
                  <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: '18px', marginBottom: '6px' }}>🎨</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827', marginBottom: '2px' }}>Portfolio First</div>
                    <div style={{ fontSize: '11.5px', color: '#6B7280' }}>Showcase published generative works and assets.</div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: '18px', marginBottom: '6px' }}>🛡️</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827', marginBottom: '2px' }}>Verified Claims</div>
                    <div style={{ fontSize: '11.5px', color: '#6B7280' }}>Add process files and prompts to earn trust.</div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: '18px', marginBottom: '6px' }}>⚡</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827', marginBottom: '2px' }}>Admin Review</div>
                    <div style={{ fontSize: '11.5px', color: '#6B7280' }}>Curated approval guarantees marketplace quality.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CREATOR IDENTITY & BIO */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E0B38', marginBottom: '4px' }}>
                  Creator Identity & Professional Introduction
                </h2>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                  Introduce yourself to hiring brands and creative directors.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Aanya Sharma"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Creator Handle *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#9CA3AF', fontSize: '13px' }}>@</span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="handle"
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 28px',
                        borderRadius: '10px',
                        border: '1px solid #E5E7EB',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                  Primary Specialization *
                </label>
                <select
                  value={primarySpecialization}
                  onChange={(e) => setPrimarySpecialization(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #E5E7EB',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="Generative Video & Concept Art">Generative Video & Concept Art</option>
                  <option value="3D Motion & VFX Synthesis">3D Motion & VFX Synthesis</option>
                  <option value="Editorial & Fashion Photography">Editorial & Fashion Photography</option>
                  <option value="Product Rendering & Packaging">Product Rendering & Packaging</option>
                  <option value="Virtual Worlds & Neural Environments">Virtual Worlds & Neural Environments</option>
                  <option value="AI Music & Audio Composition">AI Music & Audio Composition</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                  Professional Biography * (min 15 characters)
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your creative process, generative workflows, commercial background, and the types of brand campaigns you excel at..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #E5E7EB',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
                <div style={{ fontSize: '11px', color: bio.length >= 15 ? '#059669' : '#9CA3AF', marginTop: '2px', textAlign: 'right' }}>
                  {bio.length} characters {bio.length < 15 && '(minimum 15 required)'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. London / Remote"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Minimum Project Budget (INR ₹)
                  </label>
                  <input
                    type="number"
                    min={10000}
                    step={1000}
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CATEGORIES, SKILLS & TOOLS */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E0B38', marginBottom: '4px' }}>
                  Creative Domains, Skills & Tools
                </h2>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                  Select the creative categories and software tools you use for AI generation.
                </p>
              </div>

              {/* Categories */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#1E0B38', marginBottom: '8px' }}>
                  Select Relevant Creative Categories
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {availableCategories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id) || selectedCategories.includes(cat.slug);
                    return (
                      <button
                        type="button"
                        key={cat.id || cat.slug}
                        onClick={() => {
                          const catId = cat.id || cat.slug;
                          setSelectedCategories((prev) =>
                            isSelected ? prev.filter((id) => id !== catId) : [...prev, catId]
                          );
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: isSelected ? '1.5px solid #7952EC' : '1px solid #E5E7EB',
                          backgroundColor: isSelected ? '#EDE9FE' : '#FFFFFF',
                          color: isSelected ? '#6D28D9' : '#4B5563',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{cat.icon || '✦'}</span>
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Skills */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#1E0B38', marginBottom: '8px' }}>
                  Skills & Techniques
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {availableSkills.slice(0, 15).map((sk) => {
                    const isSelected = selectedSkills.includes(sk.id);
                    return (
                      <button
                        type="button"
                        key={sk.id}
                        onClick={() => {
                          setSelectedSkills((prev) =>
                            isSelected ? prev.filter((id) => id !== sk.id) : [...prev, sk.id]
                          );
                        }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          fontWeight: '600',
                          border: isSelected ? '1.5px solid #059669' : '1px solid #E5E7EB',
                          backgroundColor: isSelected ? '#ECFDF5' : '#F9FAFB',
                          color: isSelected ? '#065F46' : '#4B5563',
                          cursor: 'pointer',
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {sk.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tools */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#1E0B38', marginBottom: '8px' }}>
                  AI Generation Tools & Software
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {availableTools.slice(0, 16).map((tl) => {
                    const isSelected = selectedTools.includes(tl.id);
                    return (
                      <button
                        type="button"
                        key={tl.id}
                        onClick={() => {
                          setSelectedTools((prev) =>
                            isSelected ? prev.filter((id) => id !== tl.id) : [...prev, tl.id]
                          );
                        }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          fontWeight: '600',
                          border: isSelected ? '1.5px solid #7952EC' : '1px solid #E5E7EB',
                          backgroundColor: isSelected ? '#EDE9FE' : '#F9FAFB',
                          color: isSelected ? '#6D28D9' : '#4B5563',
                          cursor: 'pointer',
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {tl.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PORTFOLIO PROJECTS */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E0B38', marginBottom: '4px' }}>
                    Portfolio Projects & Process Evidence
                  </h2>
                  <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                    Add at least 1 published project to complete onboarding.
                  </p>
                </div>
                {!isAddingProject && (
                  <button
                    type="button"
                    onClick={() => setIsAddingProject(true)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      backgroundColor: '#7952EC',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    + Add New Project
                  </button>
                )}
              </div>

              {/* Add Project Form Modal/Inline */}
              {isAddingProject && (
                <form
                  onSubmit={handleCreateProject}
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '1.5px solid #EDE9FE',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1E0B38', margin: 0 }}>
                    New Portfolio Project Details
                  </h3>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                      Project Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newProject.title}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                      placeholder="e.g. Lumina Dewdrop — Cinematic Product Reel"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D1D5DB',
                        fontSize: '13px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                      Project Description *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      placeholder="Explain the creative brief, tools used (e.g. Midjourney + Runway Gen-3), and generative technique..."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D1D5DB',
                        fontSize: '13px',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                        Content Type
                      </label>
                      <select
                        value={newProject.content_type}
                        onChange={(e) => setNewProject({ ...newProject, content_type: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '13px',
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        <option value="VIDEO">Cinematic Video</option>
                        <option value="ANIMATION">Animation / Motion</option>
                        <option value="IMAGE">Editorial Stills</option>
                        <option value="PRODUCT_VIZ">Product Visualization</option>
                        <option value="CONCEPT_ART">Concept Art</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                        Aspect Ratio
                      </label>
                      <select
                        value={newProject.aspect_ratio}
                        onChange={(e) => setNewProject({ ...newProject, aspect_ratio: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '13px',
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        <option value="16:9">16:9 (Landscape)</option>
                        <option value="9:16">9:16 (Vertical Reel)</option>
                        <option value="1:1">1:1 (Square)</option>
                        <option value="4:5">4:5 (Portrait)</option>
                      </select>
                    </div>
                  </div>

                  {/* Supporting Evidence */}
                  <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '10px', marginTop: '4px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#6D28D9', marginBottom: '6px' }}>
                      🛡️ Optional Process Evidence (Boosts verification tier)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="Evidence title (e.g. Node workflow / Prompts)"
                        value={newProject.evidence_title}
                        onChange={(e) => setNewProject({ ...newProject, evidence_title: e.target.value })}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '12px',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="File link or preview URL"
                        value={newProject.evidence_file_url}
                        onChange={(e) => setNewProject({ ...newProject, evidence_file_url: e.target.value })}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '12px',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddingProject(false)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1px solid #D1D5DB',
                        backgroundColor: '#FFFFFF',
                        color: '#6B7280',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '8px',
                        backgroundColor: '#7952EC',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {isSaving ? 'Saving Project...' : 'Save Portfolio Work'}
                    </button>
                  </div>
                </form>
              )}

              {/* Projects List */}
              {projects.length === 0 ? (
                <div
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '1.5px dashed #E5E7EB',
                    borderRadius: '16px',
                    padding: '2.5rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎨</div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                    No Portfolio Projects Added Yet
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#6B7280', maxWidth: '400px', margin: '0 auto 1rem' }}>
                    To submit your creator profile for administrator review, you must add at least one piece of generative AI work.
                  </p>
                  {!isAddingProject && (
                    <button
                      type="button"
                      onClick={() => setIsAddingProject(true)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '10px',
                        backgroundColor: '#7952EC',
                        color: '#FFFFFF',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      + Add Your First Project
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '14px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div style={{ height: '130px', position: 'relative', backgroundColor: '#EDE9FE' }}>
                        <img
                          src={proj.thumbnail_url || proj.primary_asset_url || '/assets/campaign-covers/brand_skincare_cover.jpg'}
                          alt={proj.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/assets/campaign-covers/brand_fashion_cover.jpg';
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            backgroundColor: 'rgba(30, 11, 56, 0.85)',
                            color: '#FFFFFF',
                            fontSize: '10px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '999px',
                          }}
                        >
                          {proj.content_type || 'WORK'}
                        </span>
                      </div>
                      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#111827', margin: '0 0 4px', lineHeight: '1.3' }}>
                            {proj.title}
                          </h4>
                          <p style={{ fontSize: '11.5px', color: '#6B7280', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {proj.description}
                          </p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(proj.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#EF4444',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              padding: '2px 6px',
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: PREVIEW & SUBMIT CHECKLIST */}
          {currentStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E0B38', marginBottom: '4px' }}>
                  Profile Preview & Submission Checklist
                </h2>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                  Review your information before submitting to the Kivora review board.
                </p>
              </div>

              {/* Checklist */}
              <div
                style={{
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E0B38', marginBottom: '4px' }}>
                  Readiness Audit
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px' }}>
                  <span>{displayName ? '✅' : '❌'}</span>
                  <span style={{ color: displayName ? '#065F46' : '#991B1B', fontWeight: '600' }}>
                    Creator Display Name: {displayName || 'Missing'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px' }}>
                  <span>{bio && bio.length >= 15 ? '✅' : '❌'}</span>
                  <span style={{ color: bio && bio.length >= 15 ? '#065F46' : '#991B1B', fontWeight: '600' }}>
                    Professional Biography ({bio ? `${bio.length} chars` : 'Missing'})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px' }}>
                  <span>{projects.length >= 1 ? '✅' : '❌'}</span>
                  <span style={{ color: projects.length >= 1 ? '#065F46' : '#991B1B', fontWeight: '600' }}>
                    Published Portfolio Projects ({projects.length} project{projects.length !== 1 ? 's' : ''})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px' }}>
                  <span>{selectedCategories.length > 0 ? '✅' : '⚠️'}</span>
                  <span style={{ color: selectedCategories.length > 0 ? '#065F46' : '#D97706', fontWeight: '600' }}>
                    Creative Domains ({selectedCategories.length} selected)
                  </span>
                </div>
              </div>

              {/* Profile Card Preview */}
              <div
                style={{
                  borderRadius: '16px',
                  border: '1.5px solid #EDE9FE',
                  padding: '1.5rem',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 4px 14px rgba(121,82,236,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '1rem' }}>
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #EDE9FE' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/creator-portraits/devon.jpg';
                    }}
                  />
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1E0B38', margin: '0 0 2px' }}>
                      {displayName || 'Aanya Sharma'}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#7952EC', fontWeight: '600' }}>
                      @{handle} • {primarySpecialization}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                      📍 {location} • {yearsExperience} yrs exp • Min: ${minBudget}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '12.5px', color: '#4B5563', lineHeight: '1.5', margin: '0 0 1rem' }}>
                  {bio || 'No biography written yet.'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedTools.map((tId) => (
                    <span
                      key={tId}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      {tId}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '2rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #F3F4F6',
            }}
          >
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    border: '1px solid #D1D5DB',
                    backgroundColor: '#FFFFFF',
                    color: '#374151',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleSaveProfile(false)}
                disabled={isSaving}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(121,82,236,0.2)',
                  backgroundColor: '#F5F3FF',
                  color: '#6D28D9',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '10px',
                    backgroundColor: '#7952EC',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(121, 82, 236, 0.25)',
                  }}
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSaving || projects.length === 0 || !displayName || !bio || bio.length < 15}
                  style={{
                    padding: '8px 28px',
                    borderRadius: '10px',
                    backgroundColor:
                      projects.length === 0 || !displayName || !bio || bio.length < 15
                        ? '#D1D5DB'
                        : '#059669',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: '800',
                    border: 'none',
                    cursor:
                      projects.length === 0 || !displayName || !bio || bio.length < 15
                        ? 'not-allowed'
                        : 'pointer',
                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                  }}
                >
                  {isSaving ? 'Submitting...' : 'Submit Profile for Review 🚀'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
