import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Button } from '@/components/ui/button';
import { Bug, User, LogOut, LayoutDashboard, Trophy, Shield, Menu, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const MobileNavLinks = () => (
    <div className="flex flex-col gap-4 mt-8">
      <SheetClose asChild>
        <Link 
          to="/programs" 
          className="text-foreground hover:text-primary transition-colors text-lg py-2"
        >
          Programas
        </Link>
      </SheetClose>
      <SheetClose asChild>
        <Link 
          to="/leaderboard" 
          className="text-foreground hover:text-primary transition-colors flex items-center gap-2 text-lg py-2"
        >
          <Trophy className="h-5 w-5" />
          Leaderboard
        </Link>
      </SheetClose>
      
      {user ? (
        <>
          <div className="border-t border-border my-4" />
          <SheetClose asChild>
            <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors flex items-center gap-2 text-lg py-2">
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link to="/profile" className="text-foreground hover:text-primary transition-colors flex items-center gap-2 text-lg py-2">
              <User className="h-5 w-5" />
              Perfil
            </Link>
          </SheetClose>
          {isAdmin && (
            <SheetClose asChild>
              <Link to="/admin" className="text-foreground hover:text-primary transition-colors flex items-center gap-2 text-lg py-2">
                <Shield className="h-5 w-5 text-yellow-500" />
                Painel Admin
              </Link>
            </SheetClose>
          )}
          <div className="border-t border-border my-4" />
          <button
            onClick={() => {
              handleSignOut();
              setIsOpen(false);
            }}
            className="text-destructive hover:text-destructive/80 transition-colors flex items-center gap-2 text-lg py-2"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </>
      ) : (
        <>
          <div className="border-t border-border my-4" />
          <SheetClose asChild>
            <Button variant="ghost" onClick={() => navigate('/auth')} className="justify-start text-lg">
              Entrar
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button onClick={() => navigate('/auth?mode=signup')} className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg">
              Começar
            </Button>
          </SheetClose>
        </>
      )}
    </div>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Bug className="h-7 w-7 sm:h-8 sm:w-8 text-primary transition-all group-hover:text-glow" />
              <div className="absolute inset-0 blur-md bg-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-primary text-glow-sm font-mono hidden xs:inline">
              AfriSec Hunters
            </span>
            <span className="text-lg font-bold text-primary text-glow-sm font-mono xs:hidden">
              AfriSec
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/programs" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Programas
            </Link>
            <Link 
              to="/leaderboard" 
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Link>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="hidden lg:inline text-primary font-mono">
                      {profile?.display_name || 'Hunter'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4 text-yellow-500" />
                      Painel Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => navigate('/auth')}>
                  Entrar
                </Button>
                <Button onClick={() => navigate('/auth?mode=signup')} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Começar
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6 text-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background border-border">
              <div className="flex items-center gap-2">
                <Bug className="h-6 w-6 text-primary" />
                <span className="font-bold text-primary font-mono">AfriSec Hunters</span>
              </div>
              <MobileNavLinks />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}