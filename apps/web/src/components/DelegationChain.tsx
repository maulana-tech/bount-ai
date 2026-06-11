import type { DelegationNode } from "@concierge/shared";
import { CornerFrame } from "./CornerFrame";
import { NodeChip } from "./ui/NodeChip";

/**
 * Visual aliran budget: user → concierge → specialist (UI_GUIDE §6).
 * Garis penghubung digambar div, bukan karakter.
 */
export function DelegationChain({ nodes }: { nodes: DelegationNode[] }) {
  const user = nodes.find((n) => n.role === "user");
  const concierge = nodes.find((n) => n.role === "concierge");
  const specialists = nodes.filter(
    (n) => n.role !== "user" && n.role !== "concierge",
  );

  return (
    <CornerFrame label="Delegation">
      <div className="flex items-center gap-2">
        {user && <NodeChip name={user.label} cap={user.cap} active={user.active} />}
        <Connector />
        {concierge && (
          <NodeChip name={concierge.label} cap={concierge.cap} active={concierge.active} />
        )}
        <Connector />
        <div className="flex flex-col gap-2">
          {specialists.map((n) => (
            <NodeChip key={n.id} name={n.label} cap={n.cap} active={n.active} />
          ))}
        </div>
      </div>
    </CornerFrame>
  );
}

function Connector() {
  return <div aria-hidden className="h-px w-5 shrink-0 bg-line-strong" />;
}
