import * as React from 'react';
import { Redirect, type Href } from 'expo-router';
import { hasSession } from '@/lib/api/session';

export default function Index() {
  const [checked, setChecked] = React.useState(false);
  const [authed, setAuthed] = React.useState(false);

  React.useEffect(() => {
    hasSession().then((ok) => {
      setAuthed(ok);
      setChecked(true);
    });
  }, []);

  if (!checked) return null;

  return (
    <Redirect
      href={(authed ? '/(tabs)/discovery' : '/(auth)/welcome') as Href}
    />
  );
}
