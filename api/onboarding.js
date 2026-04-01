import request from './request';

export async function getOnboardingStatus() {
  const res = await request('/api/onboarding');
  return res.data;
}

export async function updateOnboarding(data) {
  await request('/api/onboarding', 'PATCH', { data });
}
