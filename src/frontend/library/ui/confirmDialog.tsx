interface ConfirmDialogInterface {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({ title, message, onConfirm, onCancel }: ConfirmDialogInterface) {
    return (
        <div className="settings-overlay" role="presentation" onClick={onCancel}>
            <section className="settings-pane" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                <h2 id="confirm-title">{title}</h2>
                <p style={{ marginBottom: '20px' }}>{message}</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                        style={{ backgroundColor: 'var(--danger)', backgroundImage: 'none' }}
                        onClick={onConfirm}
                    >
                        Löschen
                    </button>
                    <button
                        style={{ backgroundColor: 'var(--surface-strong)', backgroundImage: 'none', color: 'var(--text)' }}
                        onClick={onCancel}
                    >
                        Abbrechen
                    </button>
                </div>
            </section>
        </div>
    );
}
