import ProfileView from '../../components/account/ProfileView';

export default function CustomerAccount() {
  return (
    <ProfileView
      title="My Profile"
      accountLabel="Customer"
      shopHref="/shop"
      shopLabel="Continue shopping"
    />
  );
}
