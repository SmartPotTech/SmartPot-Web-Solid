export function LogoMark(props: { size?: number }) {
    const size = () => props.size ?? 36;
    return (
        <svg width={size()} height={size()} viewBox="0 0 512 512" aria-hidden="true">
            <rect width="512" height="512" rx="112" fill="#0B3D2B"/>
            <path d="M332 112a78 78 0 0 1 68 68" fill="none" stroke="#2D9CDB" stroke-width="20" stroke-linecap="round"/>
            <path d="M332 70a120 120 0 0 1 110 110" fill="none" stroke="#2D9CDB" stroke-width="20" stroke-linecap="round"
                  opacity=".55"/>
            <path d="M256 322V214" fill="none" stroke="#00B074" stroke-width="20" stroke-linecap="round"/>
            <path d="M254 254c-10-58-56-92-120-86 4 62 48 98 120 86z" fill="#00B074"/>
            <path d="M258 224c10-64 60-100 128-94-6 68-54 104-128 94z" fill="#7FDBB0"/>
            <path d="M150 324h212l-26 124a26 26 0 0 1-25 21H201a26 26 0 0 1-25-21z" fill="#D9734E"/>
            <rect x="132" y="300" width="248" height="44" rx="16" fill="#B85A38"/>
        </svg>
    );
}

export function Logo(props: { size?: number; inverse?: boolean }) {
    return (
        <span class="inline-flex items-center gap-2.5">
            <LogoMark size={props.size}/>
            <span class={`font-display text-xl font-bold tracking-tight ${props.inverse ? "text-white" : "text-leaf-900"}`}>
                Smart<span class="text-leaf-500">Pot</span>
            </span>
        </span>
    );
}
