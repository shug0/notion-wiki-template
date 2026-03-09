import { getSession } from "@/lib/auth/session";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LoginLink } from "./login-link";
import { UserMenu } from "./user-menu";

export async function AuthButton() {
  const session = await getSession();

  if (!session) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span />}>
          <LoginLink />
        </TooltipTrigger>
        <TooltipContent>Se connecter</TooltipContent>
      </Tooltip>
    );
  }

  return <UserMenu email={session.email} />;
}
