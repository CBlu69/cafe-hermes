(function () {
    var PIN = '1234'
    var STORAGE_KEY = 'cafeHermes_unavailable'

    var body = document.body
    var lockBtn = document.getElementById('staff-lock-btn')
    var banner = document.getElementById('staff-banner')
    var resetBtn = document.getElementById('reset-menu-btn')
    var exitBtn = document.getElementById('exit-staff-btn')
    var toastContainer = document.getElementById('toast-container')
    var modal = document.getElementById('pin-modal')
    var pinBoxes = document.getElementById('pin-boxes')
    var pinError = document.getElementById('pin-error')
    var pinCancel = document.getElementById('pin-cancel')
    var qrBtn = document.getElementById('qr-btn')
    var qrModal = document.getElementById('qr-modal')
    var qrBox = document.getElementById('qr-code')
    var qrLink = document.getElementById('qr-link')
    var qrCopyBtn = document.getElementById('qr-copy-btn')
    var qrCloseBtn = document.getElementById('qr-close-btn')

    var staffMode = false
    var pinOpen = false
    var qrOpen = false
    var unavailable = load()
    var server = null
    var serverReady = false

    function load() {
        try {
            var v = JSON.parse(localStorage.getItem(STORAGE_KEY))
            return Array.isArray(v) ? v : []
        } catch (e) {
            return []
        }
    }

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(unavailable))
        } catch (e) { }
    }

    function toast(msg, type) {
        var t = document.createElement('div')
        t.className = 'toast' + (type === 'success' ? ' success' : '')
        t.textContent = msg
        toastContainer.appendChild(t)
        setTimeout(function () {
            t.classList.add('hide')
            setTimeout(function () { t.remove() }, 350)
        }, 2200)
    }

    function apply() {
        document.querySelectorAll('.menu-item').forEach(function (item) {
            var off = unavailable.indexOf(item.dataset.id) > -1
            item.classList.toggle('unavailable', off)
            var badge = item.querySelector('.unavailable-badge')
            if (badge) badge.style.display = off ? 'block' : 'none'
        })
    }

    function setStaff(on) {
        staffMode = on
        body.classList.toggle('staff-mode', on)
        banner.classList.toggle('show', on)
        lockBtn.classList.toggle('active', on)
    }

    function getName(item) {
        var h = item.querySelector('h3')
        return h ? h.textContent.trim() : 'آیتم'
    }

    /* ============================================================
       سرور (Supabase) — ذخیره مشترک بین همه گوشی‌ها
       ============================================================ */
    function initServer() {
        if (!window.CAFE_CONFIG || !CAFE_CONFIG.serverEnabled) return
        try {
            if (!window.supabase) return
            server = window.supabase.createClient(CAFE_CONFIG.supabaseUrl, CAFE_CONFIG.supabaseAnonKey)
            serverReady = true

            server.from(CAFE_CONFIG.table)
                .select('id')
                .eq('unavailable', true)
                .then(function (res) {
                    if (res.error) throw res.error
                    unavailable = res.data.map(function (r) { return r.id })
                    save()
                    apply()
                })
                .catch(function () {
                    unavailable = load()
                    apply()
                })

            server.channel('cafe-menu-realtime')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: CAFE_CONFIG.table
                }, function (payload) {
                    var row = payload.new
                    var oldRow = payload.old
                    if (payload.eventType === 'DELETE') {
                        if (oldRow) removeId(oldRow.id)
                    } else if (row) {
                        if (row.unavailable) {
                            if (unavailable.indexOf(row.id) === -1) {
                                unavailable.push(row.id)
                                save(); apply()
                            }
                        } else {
                            removeId(row.id)
                        }
                    }
                })
                .subscribe()
        } catch (e) {
            serverReady = false
        }
    }

    function removeId(id) {
        var i = unavailable.indexOf(id)
        if (i > -1) {
            unavailable.splice(i, 1)
            save()
            apply()
        }
    }

    function syncItem(id, isUnavailable) {
        save()
        if (!serverReady) return
        server.from(CAFE_CONFIG.table)
            .upsert({
                id: id,
                unavailable: isUnavailable,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' })
            .then(function (res) {
                if (res.error) throw res.error
            })
            .catch(function () {
                toast('اتصال سرور قطع شد — فقط روی همین گوشی ذخیره شد')
            })
    }

    /* ============================================================
       مودال رمز PIN
       ============================================================ */
    function pinValue() {
        var v = ''
        for (var i = 0; i < pinBoxes.children.length; i++) v += pinBoxes.children[i].value
        return v
    }

    function clearPin() {
        for (var i = 0; i < pinBoxes.children.length; i++) {
            pinBoxes.children[i].value = ''
        }
    }

    function setPinError(show) {
        pinError.classList.toggle('show', show)
    }

    function openModal() {
        pinOpen = true
        modal.classList.add('show')
        modal.setAttribute('aria-hidden', 'false')
        body.style.overflow = 'hidden'
        setTimeout(function () {
            var box = pinBoxes.querySelector('.pin-box')
            if (box) box.focus()
        }, 120)
    }

    function closeModal() {
        pinOpen = false
        modal.classList.remove('show')
        modal.setAttribute('aria-hidden', 'true')
        if (!qrOpen) body.style.overflow = ''
        clearPin()
        setPinError(false)
        pinBoxes.classList.remove('shake')
    }

    function checkPin() {
        if (pinValue() === PIN) {
            closeModal()
            setStaff(true)
            toast('حالت مدیریت فعال شد — روی آیتم‌ها بزن')
        } else {
            setPinError(true)
            pinBoxes.classList.remove('shake')
            void pinBoxes.offsetWidth
            pinBoxes.classList.add('shake')
            clearPin()
            setTimeout(function () {
                var box = pinBoxes.querySelector('.pin-box')
                if (box) box.focus()
            }, 50)
        }
    }

    Array.prototype.forEach.call(pinBoxes.children, function (box, idx) {
        box.addEventListener('input', function () {
            var d = box.value.replace(/[^0-9]/g, '')
            box.value = d
            if (d) {
                if (idx < pinBoxes.children.length - 1) {
                    pinBoxes.children[idx + 1].focus()
                } else {
                    checkPin()
                }
            }
        })
        box.addEventListener('keydown', function (e) {
            if (e.key === 'Backspace' && !box.value && idx > 0) {
                pinBoxes.children[idx - 1].focus()
            }
            if (e.key === 'Enter') checkPin()
        })
        box.addEventListener('paste', function (e) {
            e.preventDefault()
            var pasted = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '').slice(0, pinBoxes.children.length)
            for (var i = 0; i < pasted.length; i++) pinBoxes.children[i].value = pasted[i]
            if (pasted.length === pinBoxes.children.length) checkPin()
            else pinBoxes.children[Math.min(pasted.length, pinBoxes.children.length - 1)].focus()
        })
        box.addEventListener('click', function () { this.select() })
    })

    pinCancel.addEventListener('click', closeModal)
    modal.querySelector('.pin-overlay').addEventListener('click', closeModal)

    lockBtn.addEventListener('click', function () {
        if (staffMode) {
            setStaff(false)
            toast('حالت مدیریت خاموش شد')
            return
        }
        openModal()
    })

    exitBtn.addEventListener('click', function () {
        setStaff(false)
        toast('حالت مدیریت خاموش شد')
    })

    resetBtn.addEventListener('click', function () {
        if (serverReady) {
            var ids = []
            document.querySelectorAll('.menu-item').forEach(function (item) { ids.push(item.dataset.id) })
            var rows = ids.map(function (id) {
                return { id: id, unavailable: false, updated_at: new Date().toISOString() }
            })
            server.from(CAFE_CONFIG.table)
                .upsert(rows, { onConflict: 'id' })
                .then(function (res) {
                    if (res.error) throw res.error
                })
                .catch(function () { })
        }
        unavailable = []
        save()
        apply()
        toast('همه آیتم‌ها موجود شدن ✓', 'success')
    })

    document.querySelectorAll('.menu-item').forEach(function (item) {
        item.addEventListener('click', function (e) {
            if (!staffMode) return
            if (e.target.closest('.unavailable-badge')) return
            var id = item.dataset.id
            var i = unavailable.indexOf(id)
            if (i > -1) {
                unavailable.splice(i, 1)
                toast('«' + getName(item) + '» موجود شد ✓', 'success')
                syncItem(id, false)
            } else {
                unavailable.push(id)
                toast('«' + getName(item) + '» ناموجود شد')
                syncItem(id, true)
            }
            save()
            apply()
        })
        item.addEventListener('mousemove', function (e) {
            var r = item.getBoundingClientRect()
            item.style.setProperty('--mx', (e.clientX - r.left) + 'px')
            item.style.setProperty('--my', (e.clientY - r.top) + 'px')
        })
    })

    /* ============================================================
       مودال QR
       ============================================================ */
    function openQr() {
        qrOpen = true
        qrModal.classList.add('show')
        qrModal.setAttribute('aria-hidden', 'false')
        body.style.overflow = 'hidden'
        if (!qrBox.dataset.done) {
            qrBox.dataset.done = '1'
            var url = location.href
            if (qrLink) qrLink.textContent = url
            try {
                if (window.QRCode) {
                    new QRCode(qrBox, {
                        text: url,
                        width: 200,
                        height: 200,
                        colorDark: '#f6f6f6',
                        colorLight: '#101010'
                    })
                } else {
                    qrBox.textContent = 'ساخت QR نیاز به اینترنت داره'
                }
            } catch (e) {
                qrBox.textContent = url
            }
        }
    }

    function closeQr() {
        qrOpen = false
        qrModal.classList.remove('show')
        qrModal.setAttribute('aria-hidden', 'true')
        if (!pinOpen) body.style.overflow = ''
    }

    function copyLink() {
        var url = qrLink ? qrLink.textContent : location.href
        function done() { toast('لینک کپی شد ✓', 'success') }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(done).catch(function () { fallback() })
        } else {
            fallback()
        }
        function fallback() {
            var ta = document.createElement('textarea')
            ta.value = url
            ta.style.position = 'fixed'
            ta.style.opacity = '0'
            document.body.appendChild(ta)
            ta.select()
            try { document.execCommand('copy'); done() } catch (e) { toast('نتونستم کپی کنم') }
            ta.remove()
        }
    }

    if (qrBtn) qrBtn.addEventListener('click', openQr)
    if (qrCloseBtn) qrCloseBtn.addEventListener('click', closeQr)
    if (qrCopyBtn) qrCopyBtn.addEventListener('click', copyLink)
    if (qrModal) qrModal.querySelector('.pin-overlay').addEventListener('click', closeQr)

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (pinOpen) closeModal()
            if (qrOpen) closeQr()
        }
    })

    /* ============================================================
       فیلتر + جستجو
       ============================================================ */
    var tabs = document.querySelectorAll('.filter-tab')
    var sections = document.querySelectorAll('.menu-section')
    var search = document.getElementById('menu-search')

    function applyFilter(animate) {
        var f = (document.querySelector('.filter-tab.active') || { dataset: { filter: 'all' } }).dataset.filter
        var q = (search ? search.value : '').trim().toLowerCase()

        if (animate) {
            document.querySelectorAll('.menu-item').forEach(function (it) { it.classList.remove('animate-in') })
            sections.forEach(function (s) { s.classList.remove('animate-in') })
            void document.body.offsetWidth
        }

        sections.forEach(function (sec, si) {
            var cat = sec.dataset.cat
            var show = f === 'all' || cat === f
            if (!show) { sec.style.display = 'none'; return }
            var visible = 0
            sec.querySelectorAll('.menu-item').forEach(function (item) {
                var name = item.dataset.name || ''
                var match = !q || name.toLowerCase().indexOf(q) > -1
                if (match) {
                    item.style.display = ''
                    item.style.setProperty('--i', visible)
                    if (animate) item.classList.add('animate-in')
                    visible++
                } else {
                    item.style.display = 'none'
                    item.classList.remove('animate-in')
                }
            })
            var count = sec.querySelector('.menu-count')
            if (count) {
                count.textContent = visible + ' مورد'
                count.classList.remove('bump')
                void count.offsetWidth
                count.classList.add('bump')
            }
            sec.style.display = visible ? '' : 'none'
            if (animate && visible) {
                sec.style.setProperty('--i', si)
                sec.classList.add('animate-in')
            }
        })
    }

    tabs.forEach(function (t) {
        t.addEventListener('click', function () {
            tabs.forEach(function (x) { x.classList.remove('active') })
            t.classList.add('active')
            applyFilter(true)
        })
    })

    if (search) {
        search.addEventListener('input', function () { applyFilter(false) })
    }

    /* ============================================================
       فوتوی آیتم‌ها: وقتی عکس آپلود شد نمایش بده
       ============================================================ */
    document.querySelectorAll('.menu-item-photo img').forEach(function (img) {
        img.addEventListener('load', function () {
            img.parentElement.classList.add('has-photo')
        })
        img.addEventListener('error', function () {
            img.parentElement.classList.remove('has-photo')
        })
    })

    applyFilter()
    apply()
    initServer()
})()
