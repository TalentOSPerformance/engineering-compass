import { redirect } from 'next/navigation';

export default function MetricsRedirect() {
  redirect('/metrics/delivery');
}
