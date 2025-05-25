import { redirect } from 'next/navigation';
import { cookies } from 'next/headers'; // or 'next-auth' if you use it
import Dashboard from './Dashboard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default async function DashboardBase() {
  const cookiesList = await cookies();
  const token = cookiesList.get('auth_token')?.value || '';
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!response.ok) {
      return redirect('/?expired_session=true');
    }
    return <Dashboard />;
    // eslint-disable-next-line
  } catch (err: any) {
    return redirect('/?expired_session=true');
  }
}
