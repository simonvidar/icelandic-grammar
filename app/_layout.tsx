import { Drawer } from 'expo-router/drawer';

export default function Layout() {
  return <Drawer>
  <Drawer.Screen
    name="index" // This is the name of the page and must match the url from root
    options={{
      drawerLabel: 'Home',
      title: 'Home',
    }}
  />
  <Drawer.Screen
    name="noun_gender/index" // This is the name of the page and must match the url from root
    options={{
      drawerLabel: 'Noun gender',
      title: 'Noun gender',
    }}
  />
</Drawer>;
}