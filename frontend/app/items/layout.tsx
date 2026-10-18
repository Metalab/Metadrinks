import ItemsClientLayout from "./client-layout";

export default function ItemsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <ItemsClientLayout>{children}</ItemsClientLayout>
    </div>
  );
}
