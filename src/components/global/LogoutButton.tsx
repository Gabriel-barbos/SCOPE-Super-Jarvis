import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLogin } from '@/services/LoginService';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

export const LogoutButton = () => {
  const { logout } = useLogin();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logout realizado',
      description: 'Bye bye!',
    });
    navigate('/login');
  };

  return (
    <Button
    className='w-full justify-center mt-4'
      variant="outline"
      size="icon"
      onClick={handleLogout}
      title="Sair"
    >
      <LogOut className="h-5 w-5" />
    Sair
    </Button>
  );
};