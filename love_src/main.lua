skills = {"HTML5", "CSS3 (Grid/Flex)", "JavaScript (ES6+)", "Java Backend (Servlets)", "SAP DB", "Vanilla JS",
          "Prototype Pattern", "SVG DOM Manipulation", "CSV Parsing", "Async/Await", "PHP 5", "MySQL",
          "Barcode Hardware", "Adobe Premiere", "Logistics", "Firebase", "Supabase", "IoT Webhooks", "QR Generation",
          "Camera API", "PWA", "PWA", "Service Workers", "IndexedDB", "HTML5", "CSS3", "Animated SVG", "Vanilla JS",
          "Adobe Premiere Pro", "After Effects", "DaVinci Resolve", "Creative Direction", "Project Management",
          "Cinematography", "Adobe After Effects", "Adobe Illustrator", "Data Visualization", "Kinetic Typography",
          "VFX", "XML", "RSS Feeds", "XSD", "Adobe Audition", "Publishing Workflows", "Vendor Management", "ComfyUI",
          "Stable Diffusion", "Google Colab", "Wan 2.1", "Flux 2.0", "Gemini TTS", "OBS Studio", "vMix",
          "RTMP/HLS Protocols", "MS Teams Broadcast", "Audio Routing", "Facebook Live", "YouTube Live", "Digital SLR",
          "RAW Workflow", "Adobe Lightroom", "Adobe Photoshop", "Color Theory", "Asset Management"}

colors = {{
    r = 1,
    g = 0,
    b = 0,
    textDark = false
}, {
    r = 1,
    g = 1,
    b = 0,
    textDark = true
}, {
    r = 0,
    g = 1,
    b = 0,
    textDark = true
}, {
    r = 0,
    g = 0,
    b = 1,
    textDark = false
}, {
    r = 0,
    g = 1,
    b = 1,
    textDark = true
}, {
    r = 1,
    g = 0,
    b = 1,
    textDark = false
}, {
    r = 0.94,
    g = 0.35,
    b = 0.14,
    textDark = true
}, {
    r = 0.98,
    g = 0.69,
    b = 0.23,
    textDark = true
}, {
    r = 0,
    g = 0.4,
    b = 0.21,
    textDark = false
}, {
    r = 0.16,
    g = 0.67,
    b = 0.88,
    textDark = true
}, {
    r = 0.4,
    g = 0.17,
    b = 0.56,
    textDark = false
}, {
    r = 0.77,
    g = 0.61,
    b = 0.42,
    textDark = true
}, {
    r = 0.45,
    g = 0.29,
    b = 0.14,
    textDark = false
}, {
    r = 1,
    g = 0.57,
    b = 0.11,
    textDark = true
}, {
    r = 1,
    g = 1,
    b = 1,
    textDark = true
}}
function love.load()
    love.window.setTitle("Axel Escutia // Technical Skills Sandbox")
    love.graphics.setDefaultFilter('nearest', 'nearest')
    love.graphics.setBackgroundColor(0.08, 0.09, 0.11)

    W = love.graphics.getWidth()
    H = love.graphics.getHeight()
    world = love.physics.newWorld(0, 981, true)
    objects = {}

    mainFont = love.graphics.newFont("PixelifySans.ttf", 16)
    love.graphics.setFont(mainFont)

    ground = love.physics.newBody(world, W / 2, H - 40, "static")
    groundShape = love.physics.newRectangleShape(W * 0.85, 30)
    groundFixture = love.physics.newFixture(ground, groundShape)
end
function love.update(dt)
    world:update(dt)

    for i = #objects, 1, -1 do
        local obj = objects[i]
        local x, y = obj.body:getPosition()

        if y > H + 100 or x < -100 or x > W + 100 then
            obj.body:destroy()
            table.remove(objects, i)
        end
    end
end
function love.mousepressed(x, y, button)
    if button == 1 then
        local rawText = skills[love.math.random(#skills)]

        local finalText = rawText:gsub(" ", "\n")
        local maxLineWidth = 0
        for line in finalText:gmatch("[^\r\n]+") do
            local lineWidth = mainFont:getWidth(line)
            if lineWidth > maxLineWidth then
                maxLineWidth = lineWidth
            end
        end

        local radius = math.max(20, (maxLineWidth / 2) + 10)
        local body = love.physics.newBody(world, x, y, "dynamic")
        local shape = love.physics.newCircleShape(radius)
        local fixture = love.physics.newFixture(body, shape, 1)
        fixture:setRestitution(0.5)
        fixture:setFriction(0.3)
        body:setAngularDamping(0.6)
        table.insert(objects, {
            body = body,
            radius = radius,
            text = finalText,
            color = colors[love.math.random(#colors)]
        })
    end
end
function love.draw()

    love.graphics.setColor(0.5, 0.5, 0.6)
    love.graphics.printf(">_ CLICK TO\nTOSS SKILLS", 0, 40, W, "center")

    love.graphics.setColor(0, 0, 1, 1)
    love.graphics.polygon("fill", ground:getWorldPoints(groundShape:getPoints()))
    love.graphics.setColor(0.3, 0.3, 0.4)

    for _, obj in ipairs(objects) do
        local x, y = obj.body:getPosition()
        local angle = obj.body:getAngle()
        local r = obj.radius
        love.graphics.push()
        love.graphics.translate(x, y)
        love.graphics.rotate(angle)
        love.graphics.setColor(obj.color.r, obj.color.g, obj.color.b, 1)
        love.graphics.circle("fill", 0, 0, r)
        love.graphics.setColor(0, 0, 0, 0.4)
        love.graphics.setLineWidth(1.5)
        love.graphics.circle("line", 0, 0, r)
        if obj.color.textDark then
            love.graphics.setColor(0.1, 0.1, 0.1, 1)
        else
            love.graphics.setColor(0.95, 0.95, 0.95, 1)
        end
        local _, lineCount = obj.text:gsub("\n", "")
        lineCount = lineCount + 1
        local totalTextHeight = mainFont:getHeight() * lineCount
        love.graphics.printf(obj.text, -r, -(totalTextHeight / 2), r * 2, "center")
        love.graphics.pop()
    end

    love.graphics.setColor(0.4, 0.4, 0.5)
    love.graphics.setFont(love.graphics.newFont(10))
    love.graphics.print("ACT_BODIES: " .. #objects, 10, 10)
    love.graphics.setFont(mainFont)
end
